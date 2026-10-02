// Proveedor CLOUD-API — WhatsApp Cloud API oficial de Meta (producción).
//
// Arquitectura (desacoplada, 100% serverless → corre con el CRM en Vercel):
//
//   Meta Cloud API ──webhook──► Supabase Edge Function `wa-webhook`
//                                   │ guarda en tablas wa_chats / wa_messages
//                                   ▼
//   CRM (este provider) ──REST (anon key)── lee chats y mensajes de Supabase
//   CRM ──POST x-atlas-secret──► Edge Function `wa-send` ──Graph API──► Meta
//
// El token de Meta vive SOLO como secreto en la Edge Function (nunca en el
// front). El front usa la anon key pública de Supabase + un shared secret
// para el envío.
//
// Variables (VITE_, públicas) que consume:
//   VITE_SUPABASE_URL        https://<ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY   sb_publishable_... (o anon JWT)
//   VITE_WA_SEND_URL         <supabase_url>/functions/v1/wa-send  (opcional; se deriva)
//   VITE_WA_SEND_SECRET      shared secret para llamar a wa-send

import type {
  SendResult,
  WaCapabilities,
  WaChat,
  WaMessage,
  WaProviderStatus,
  WaUnsubscribe,
  WhatsAppProvider,
} from "./types";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
const SEND_URL =
  (import.meta.env.VITE_WA_SEND_URL as string | undefined) ??
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/wa-send` : "");
const SEND_SECRET = (import.meta.env.VITE_WA_SEND_SECRET as string | undefined) ?? "";

interface DbChat {
  id: string;
  phone: string;
  name: string | null;
  last_message: string | null;
  last_at: string | null;
  unread: number | null;
}
interface DbMessage {
  id: string;
  chat_id: string;
  direction: "in" | "out";
  text: string;
  at: string;
  status: string | null;
}

export class CloudApiProvider implements WhatsAppProvider {
  readonly id = "cloud-api" as const;
  readonly capabilities: WaCapabilities = {
    realtime: true,
    needsQr: false,
    outboundFreeform: true, // válido dentro de la ventana de 24 h; fuera requiere plantilla
    sendMedia: true,
  };

  private pollMs = 4000;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private msgHandlers = new Set<(m: WaMessage) => void>();
  private statusHandlers = new Set<(s: WaProviderStatus) => void>();
  private lastSeen = new Date().toISOString();
  private started = false;

  private get configured() {
    return Boolean(SUPABASE_URL && ANON_KEY);
  }

  private headers(): HeadersInit {
    return { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
  }

  private async rest<T>(path: string): Promise<T> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Supabase REST ${path} → ${res.status}`);
    return (await res.json()) as T;
  }

  private toMessage(m: DbMessage): WaMessage {
    return {
      id: m.id,
      chatId: m.chat_id,
      from: m.direction === "in" ? "them" : "me",
      text: m.text,
      at: m.at,
      status: (m.status as WaMessage["status"]) ?? undefined,
    };
  }

  private statusValue(): WaProviderStatus {
    return this.configured
      ? {
          provider: "cloud-api",
          state: "connected",
          me: "Cloud API",
          label: "Conectado vía WhatsApp Cloud API",
        }
      : { provider: "cloud-api", state: "disconnected", label: "Cloud API no configurada" };
  }

  async init(): Promise<void> {
    if (this.started) return;
    this.started = true;
    queueMicrotask(() => this.statusHandlers.forEach((h) => h(this.statusValue())));
    if (!this.configured) return;
    this.pollTimer = setInterval(() => void this.pollInbound(), this.pollMs);
  }

  private async pollInbound() {
    try {
      const since = encodeURIComponent(this.lastSeen);
      const rows = await this.rest<DbMessage[]>(
        `wa_messages?select=*&direction=eq.in&at=gt.${since}&order=at.asc`,
      );
      for (const r of rows) {
        if (r.at > this.lastSeen) this.lastSeen = r.at;
        this.msgHandlers.forEach((h) => h(this.toMessage(r)));
      }
    } catch {
      /* el próximo tick reintenta */
    }
  }

  async getStatus(): Promise<WaProviderStatus> {
    return this.statusValue();
  }

  async listChats(): Promise<WaChat[]> {
    if (!this.configured) return [];
    try {
      const rows = await this.rest<DbChat[]>("wa_chats?select=*&order=last_at.desc.nullslast");
      return rows.map((c) => ({
        id: c.id,
        phone: c.phone,
        name: c.name,
        lastMessage: c.last_message,
        lastAt: c.last_at,
        unread: c.unread ?? 0,
      }));
    } catch {
      return [];
    }
  }

  async getMessages(chatId: string): Promise<WaMessage[]> {
    if (!this.configured) return [];
    try {
      const rows = await this.rest<DbMessage[]>(
        `wa_messages?select=*&chat_id=eq.${encodeURIComponent(chatId)}&order=at.asc`,
      );
      return rows.map((m) => this.toMessage(m));
    } catch {
      return [];
    }
  }

  async sendMessage(chatId: string, text: string): Promise<SendResult> {
    if (!SEND_URL) {
      return { id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" };
    }
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(SEND_SECRET ? { "x-atlas-secret": SEND_SECRET } : {}),
          ...(ANON_KEY ? { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } : {}),
        },
        body: JSON.stringify({ chatId, text }),
      });
      const data = (await res.json()) as SendResult & { error?: string };
      if (!res.ok || data.status === "failed") {
        return { id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" };
      }
      return { id: data.id, at: data.at, status: data.status ?? "sent" };
    } catch {
      return { id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" };
    }
  }

  onMessage(handler: (m: WaMessage) => void): WaUnsubscribe {
    this.msgHandlers.add(handler);
    return () => this.msgHandlers.delete(handler);
  }

  onStatus(handler: (s: WaProviderStatus) => void): WaUnsubscribe {
    this.statusHandlers.add(handler);
    queueMicrotask(() => handler(this.statusValue()));
    return () => this.statusHandlers.delete(handler);
  }

  dispose(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.started = false;
    this.msgHandlers.clear();
    this.statusHandlers.clear();
  }
}
