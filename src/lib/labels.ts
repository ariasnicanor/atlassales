import type {
  LeadStatus,
  ProductStatus,
  QuoteStatus,
  TaskPriority,
  TaskStatus,
  Temperature,
  TemplateCategory,
  InteractionType,
} from "@/types";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  en_seguimiento: "En seguimiento",
  cotizado: "Cotizado",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "nuevo",
  "contactado",
  "en_seguimiento",
  "cotizado",
  "negociacion",
  "ganado",
  "perdido",
];

/** Tailwind classes for the pipeline column accent of each status. */
export const LEAD_STATUS_ACCENT: Record<LeadStatus, string> = {
  nuevo: "bg-sky-500",
  contactado: "bg-indigo-500",
  en_seguimiento: "bg-violet-500",
  cotizado: "bg-amber-500",
  negociacion: "bg-orange-500",
  ganado: "bg-emerald-500",
  perdido: "bg-rose-500",
};

export const TEMPERATURE_LABEL: Record<Temperature, string> = {
  frio: "Frío",
  tibio: "Tibio",
  caliente: "Caliente",
};

export const TEMPERATURE_EMOJI: Record<Temperature, string> = {
  frio: "🧊",
  tibio: "🌤️",
  caliente: "🔥",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
  sin_stock: "Sin stock",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
  vencida: "Vencida",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
  primer_contacto: "Primer contacto",
  seguimiento: "Seguimiento",
  cotizacion: "Cotización",
  recuperacion: "Recuperación",
};

export const INTERACTION_LABEL: Record<InteractionType, string> = {
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  email: "Email",
  reunion: "Reunión",
  nota: "Nota",
  cotizacion: "Cotización",
  cambio_estado: "Cambio de estado",
};
