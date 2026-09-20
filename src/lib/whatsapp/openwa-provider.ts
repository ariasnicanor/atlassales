// Proveedor OPENWA — cliente HTTP del microservicio Node (@open-wa/wa-automate).
//
// El microservicio corre APARTE del CRM (no en Cloudflare Workers): un
// proceso Node persistente con Chromium headless que mantiene la sesión de
// WhatsApp Web. Ver services/openwa/ para el servidor.
//
// Este cliente:
//   - consulta estado (incluido el QR para vincular el número)
//   - lista chats y mensajes
//   - envía mensajes
//   - hace polling de mensajes entrantes y de estado (tiempo real "suficiente")

import type {
  SendResult,
  WaCapabilities,
  WaChat,
  WaMessage,
  WaProviderStatus,
  WaUnsubscribe,
  WhatsAppProvider,
} from "./types";

interface OpenWaOptions {
  baseUrl: string;
  token?: string;
  pollIntervalMs?: number;
}

export class OpenWaProvider implements WhatsAppProvider {
  readonly id = "openwa" as const;
  readonly capabilities: WaCapabilities = {
    realtime: true,
    needsQr: true,
    outboundFreeform: true,
    sendMedia: true,
  };

  private baseUrl: string;
  private token?: string;
  private pollMs: number;
  private msgHandlers = new Set<(m: WaMessage) => void>();
  private statusHandlers = new Set<(s: WaProviderStatus) => void>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastEventAt = 0;
  private lastStatusKey = "";
  private started = false;

  constructor(opts: OpenWaOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.token = opts.token;
    this.pollMs = opts.pollIntervalMs ?? 4000;
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.token) h.authorization = `Bearer ${this.token}`;
    return h;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`OpenWA ${path} → ${res.status}`);
    return (await res.json()) as T;
  }

  async init(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.pollStatus();
    await this.pollEvents();
    this.pollTimer = setInterval(() => {
      void this.pollStatus();
      void this.pollEvents();
    }, this.pollMs);
  }

  private emitStatus(s: WaProviderStatus) {
    const key = `${s.state}:${s.qr ?? ""}:${s.me ?? ""}`;
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    for (const h of this.statusHandlers) h(s);
  }

  private async pollStatus() {
    try {
      const raw = await this.req<{
        state: WaProviderStatus["state"];
        qr?: string | null;
        me?: string | null;
      }>("/status");
      this.emitStatus({
        provider: "openwa",
        state: raw.state,
        qr: raw.qr ?? null,
        me: raw.me ?? null,
        label: this.labelFor(raw.state, raw.me),
      });
    } catch {
      this.emitStatus({
        provider: "openwa",
        state: "disconnected",
        label: "Microservicio OpenWA no disponible",
      });
    }
  }

  private labelFor(state: WaProviderStatus["state"], me?: string | null): string {
    switch (state) {
      case "connected":
        return me ? `Conectado como ${me}` : "Conectado";
      case "qr":
        return "Escaneá el QR para vincular WhatsApp";
      case "connecting":
        return "Conectando con WhatsApp Web…";
      case "error":
        return "Error de conexión";
      default:
        return "Desconectado";
    }
  }

  private async pollEvents() {
    try {
      const events = await this.req<WaMessage[]>(`/events?since=${this.lastEventAt}`);
      for (const m of events) {
        const t = Date.parse(m.at) || Date.now();
        if (t > this.lastEventAt) this.lastEventAt = t;
        for (const h of this.msgHandlers) h(m);
      }
    } catch {
      /* silencioso: el próximo tick reintenta */
    }
  }

  async getStatus(): Promise<WaProviderStatus> {
    try {
      const raw = await this.req<{
        state: WaProviderStatus["state"];
        qr?: string | null;
        me?: string | null;
      }>("/status");
      return {
        provider: "openwa",
        state: raw.state,
        qr: raw.qr ?? null,
        me: raw.me ?? null,
        label: this.labelFor(raw.state, raw.me),
      };
    } catch {
      return {
        provider: "openwa",
        state: "disconnected",
        label: "Microservicio OpenWA no disponible",
      };
    }
  }

  async listChats(): Promise<WaChat[]> {
    try {
      return await this.req<WaChat[]>("/chats");
    } catch {
      return [];
    }
  }

  async getMessages(chatId: string): Promise<WaMessage[]> {
    try {
      return await this.req<WaMessage[]>(`/chats/${encodeURIComponent(chatId)}/messages`);
    } catch {
      return [];
    }
  }

  async sendMessage(chatId: string, text: string): Promise<SendResult> {
    try {
      return await this.req<SendResult>("/send", {
        method: "POST",
        body: JSON.stringify({ chatId, text }),
      });
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
