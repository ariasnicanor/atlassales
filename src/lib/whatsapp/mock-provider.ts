// Proveedor MOCK — conversaciones simuladas, sin backend.
// Es el default: el demo funciona apenas abrís la app. Persiste el
// histórico simulado en localStorage para que sobreviva recargas.

import type {
  SendResult,
  WaCapabilities,
  WaChat,
  WaMessage,
  WaProviderStatus,
  WaSeed,
  WaUnsubscribe,
  WhatsAppProvider,
} from "./types";

const STORAGE_KEY = "atlas-sales-os:wa-chats:v2";

interface Persisted {
  chats: WaChat[];
  messages: Record<string, WaMessage[]>;
}

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    /* ignore */
  }
  return null;
}

export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly id = "mock" as const;
  readonly capabilities: WaCapabilities = {
    realtime: false,
    needsQr: false,
    outboundFreeform: true,
    sendMedia: false,
  };

  private chats: WaChat[];
  private messages: Record<string, WaMessage[]>;
  private msgHandlers = new Set<(m: WaMessage) => void>();
  private statusHandlers = new Set<(s: WaProviderStatus) => void>();

  constructor(seed?: WaSeed) {
    const persisted = loadPersisted();
    if (persisted) {
      this.chats = persisted.chats;
      this.messages = persisted.messages;
    } else {
      this.chats = seed?.chats ?? [];
      this.messages = seed?.messages ?? {};
      this.persist();
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ chats: this.chats, messages: this.messages } satisfies Persisted),
      );
    } catch {
      /* ignore */
    }
  }

  async init(): Promise<void> {
    // Nada que inicializar: el mock ya está "conectado".
    queueMicrotask(() => {
      for (const h of this.statusHandlers) h(this.statusValue());
    });
  }

  private statusValue(): WaProviderStatus {
    return {
      provider: "mock",
      state: "connected",
      me: "Modo demo",
      label: "Demo — conversaciones simuladas",
    };
  }

  async getStatus(): Promise<WaProviderStatus> {
    return this.statusValue();
  }

  async listChats(): Promise<WaChat[]> {
    return [...this.chats].sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
  }

  async getMessages(chatId: string): Promise<WaMessage[]> {
    return this.messages[chatId] ?? [];
  }

  async sendMessage(chatId: string, text: string): Promise<SendResult> {
    const now = new Date().toISOString();
    const msg: WaMessage = {
      id: `mock-${Date.now()}`,
      chatId,
      from: "me",
      text,
      at: now,
      status: "sent",
    };
    this.messages[chatId] = [...(this.messages[chatId] ?? []), msg];
    this.touchChat(chatId, text, now);
    this.persist();
    return { id: msg.id, at: now, status: "sent" };
  }

  private touchChat(chatId: string, lastMessage: string, at: string) {
    const existing = this.chats.find((c) => c.id === chatId);
    if (existing) {
      existing.lastMessage = lastMessage;
      existing.lastAt = at;
    } else {
      this.chats.push({ id: chatId, phone: chatId, lastMessage, lastAt: at });
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
    this.msgHandlers.clear();
    this.statusHandlers.clear();
  }
}
