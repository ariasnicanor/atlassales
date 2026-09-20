// ─────────────────────────────────────────────────────────────
// Capa de abstracción de WhatsApp.
//
// El CRM nunca habla directo con OpenWA ni con la Cloud API de Meta:
// habla con esta interfaz. Cambiar de proveedor (demo → venta real) es
// cambiar una variable de entorno, sin tocar la UI ni la lógica de leads.
//
// Proveedores:
//   - "mock"      → conversaciones simuladas (demo sin backend)
//   - "openwa"    → microservicio Node con @open-wa/wa-automate (WhatsApp Web)
//   - "cloud-api" → WhatsApp Cloud API oficial de Meta (producción)
// ─────────────────────────────────────────────────────────────

export type WaProviderId = "mock" | "openwa" | "cloud-api";

/** Estado de la conexión del proveedor con WhatsApp. */
export type WaConnectionState =
  | "connecting" // levantando / reconectando
  | "qr" // esperando escaneo de QR (solo openwa)
  | "connected" // listo para enviar/recibir
  | "disconnected" // caído / sin vincular
  | "error"; // falla irrecuperable

export interface WaProviderStatus {
  provider: WaProviderId;
  state: WaConnectionState;
  /** QR a escanear (data URL o string) cuando `state === "qr"`. */
  qr?: string | null;
  /** Número vinculado cuando `state === "connected"`. */
  me?: string | null;
  /** Texto legible para mostrar en la UI. */
  label: string;
}

/** Estado de entrega de un mensaje saliente (espeja los ticks de WhatsApp). */
export type WaMessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface WaMessage {
  id: string;
  /** Identificador de la conversación. Convención: teléfono normalizado (solo dígitos). */
  chatId: string;
  from: "me" | "them";
  text: string;
  /** ISO timestamp. */
  at: string;
  status?: WaMessageStatus;
}

export interface WaChat {
  /** Convención: teléfono normalizado (solo dígitos). */
  id: string;
  phone: string;
  name?: string | null;
  lastMessage?: string | null;
  lastAt?: string | null;
  unread?: number;
}

export interface SendResult {
  id: string;
  at: string;
  status: WaMessageStatus;
}

/**
 * Qué puede hacer un proveedor. La UI usa esto para adaptarse
 * (ej.: la Cloud API no permite texto libre fuera de la ventana de 24 h,
 * el mock no necesita QR, etc.).
 */
export interface WaCapabilities {
  /** Recibe mensajes entrantes en tiempo real (polling/webhook/socket). */
  realtime: boolean;
  /** Requiere escanear un QR para vincular el número. */
  needsQr: boolean;
  /** Permite enviar texto libre en cualquier momento (Cloud API: false fuera de 24 h). */
  outboundFreeform: boolean;
  /** Soporta envío de multimedia. */
  sendMedia: boolean;
}

export type WaUnsubscribe = () => void;

/**
 * Contrato que cumple todo proveedor de WhatsApp.
 * Todos los métodos son async y no lanzan para operaciones esperables:
 * ante error de red devuelven vacío o `status: "failed"` y lo reportan por `onStatus`.
 */
export interface WhatsAppProvider {
  readonly id: WaProviderId;
  readonly capabilities: WaCapabilities;

  /** Arranca el proveedor (abre conexión, empieza polling, etc.). Idempotente. */
  init(): Promise<void>;

  /** Estado actual de la conexión. */
  getStatus(): Promise<WaProviderStatus>;

  /** Lista de conversaciones ordenadas por última actividad (desc). */
  listChats(): Promise<WaChat[]>;

  /** Mensajes de una conversación, en orden cronológico (asc). */
  getMessages(chatId: string): Promise<WaMessage[]>;

  /** Envía un mensaje de texto. */
  sendMessage(chatId: string, text: string): Promise<SendResult>;

  /** Suscribe a mensajes entrantes. Devuelve función para desuscribir. */
  onMessage(handler: (msg: WaMessage) => void): WaUnsubscribe;

  /** Suscribe a cambios de estado de conexión. Devuelve función para desuscribir. */
  onStatus(handler: (status: WaProviderStatus) => void): WaUnsubscribe;

  /** Libera recursos (timers, sockets). */
  dispose(): void;
}

/** Semillas para el proveedor mock (se generan desde los leads del CRM). */
export interface WaSeed {
  chats: WaChat[];
  messages: Record<string, WaMessage[]>;
}

export interface WaProviderOptions {
  /** URL base del microservicio OpenWA (ej.: http://localhost:3100). */
  openWaUrl?: string;
  /** Token opcional para autenticar contra el microservicio OpenWA. */
  openWaToken?: string;
  /** Semillas para el proveedor mock. Ignorado por proveedores reales. */
  seed?: WaSeed;
  /** Intervalo de polling en ms (openwa / cloud-api). Default 4000. */
  pollIntervalMs?: number;
}

/** Normaliza teléfonos a solo dígitos para usar como chatId estable. */
export function normalizePhone(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}
