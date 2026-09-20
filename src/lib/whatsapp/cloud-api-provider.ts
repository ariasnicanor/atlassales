// Proveedor CLOUD-API — WhatsApp Cloud API oficial de Meta (producción).
//
// ESQUELETO. Este es el proveedor que se activa cuando el producto se vende
// a un cliente real. A diferencia de OpenWA:
//   - NO viola los Términos de WhatsApp → no hay riesgo de baneo del número.
//   - Funciona por webhooks HTTP → es compatible con Cloudflare Workers.
//   - Los mensajes SALIENTES fuera de la ventana de 24 h requieren PLANTILLAS
//     aprobadas por Meta (por eso `outboundFreeform` depende del contexto).
//
// Arquitectura de producción:
//
//   Meta Cloud API  ──webhook──►  Worker del CRM (/api/wa/webhook)
//         ▲                              │  guarda en DB (Supabase)
//         └──── POST /messages ──────────┘
//
// Este cliente del front consume los endpoints del PROPIO CRM (no llama a
// Meta directo: el token de Meta nunca debe estar en el browser). El Worker
// actúa de proxy + almacén.
//
// Para implementarlo:
//   1. Crear la app de WhatsApp en Meta for Developers y obtener
//      PHONE_NUMBER_ID + WABA_ID + token permanente (System User).
//   2. Configurar el webhook apuntando a /api/wa/webhook (verify token).
//   3. Implementar en el Worker: recepción de webhook, envío vía Graph API,
//      y endpoints /api/wa/chats, /api/wa/messages, /api/wa/send.
//   4. Persistir conversaciones y mapeo teléfono↔lead en Supabase.

import type {
  SendResult,
  WaCapabilities,
  WaChat,
  WaMessage,
  WaProviderStatus,
  WaUnsubscribe,
  WhatsAppProvider,
} from "./types";

const NOT_IMPLEMENTED =
  "Cloud API todavía no implementada. Ver src/lib/whatsapp/cloud-api-provider.ts para el checklist de activación.";

export class CloudApiProvider implements WhatsAppProvider {
  readonly id = "cloud-api" as const;
  readonly capabilities: WaCapabilities = {
    realtime: true,
    needsQr: false, // se vincula por Business Manager, no por QR
    outboundFreeform: false, // fuera de la ventana de 24 h hace falta plantilla aprobada
    sendMedia: true,
  };

  async init(): Promise<void> {
    // Cuando esté implementado: abrir SSE/polling contra el Worker del CRM.
  }

  async getStatus(): Promise<WaProviderStatus> {
    return {
      provider: "cloud-api",
      state: "disconnected",
      label: "Cloud API no configurada",
    };
  }

  async listChats(): Promise<WaChat[]> {
    return [];
  }

  async getMessages(): Promise<WaMessage[]> {
    return [];
  }

  async sendMessage(): Promise<SendResult> {
    console.warn(NOT_IMPLEMENTED);
    return { id: `noop-${Date.now()}`, at: new Date().toISOString(), status: "failed" };
  }

  onMessage(): WaUnsubscribe {
    return () => {};
  }

  onStatus(handler: (s: WaProviderStatus) => void): WaUnsubscribe {
    queueMicrotask(() =>
      handler({ provider: "cloud-api", state: "disconnected", label: "Cloud API no configurada" }),
    );
    return () => {};
  }

  dispose(): void {}
}
