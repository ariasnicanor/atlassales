// Configuración comercial de la landing.

/**
 * Número de WhatsApp de ventas (recibe los pedidos de demo), en formato
 * internacional sin "+" ni espacios. Celular AR: 54 + 9 + área + número.
 */
export const SALES_WHATSAPP = "5492664258094";

export function buildWhatsAppLink(text: string): string {
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export const DEMO_URL = "/login";
