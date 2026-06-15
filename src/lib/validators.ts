import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  source: z.string().min(1, "Indicá el origen"),
  status: z.enum([
    "nuevo",
    "contactado",
    "en_seguimiento",
    "cotizado",
    "negociacion",
    "ganado",
    "perdido",
  ]),
  temperature: z.enum(["frio", "tibio", "caliente"]),
  product_interest: z.string().optional().or(z.literal("")),
  assigned_user_id: z.string().optional().or(z.literal("")),
  next_contact_at: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
export type LeadFormValues = z.infer<typeof leadSchema>;

export const clientSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  company_name: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
export type ClientFormValues = z.infer<typeof clientSchema>;

export const productSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  brand: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Indicá la categoría"),
  condition: z.enum(["nuevo", "usado"]),
  version: z.string().optional().or(z.literal("")),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  mileage_km: z.coerce.number().int().min(0).optional(),
  fuel: z.string().optional().or(z.literal("")),
  transmission: z.string().optional().or(z.literal("")),
  list_price: z.coerce.number().min(0, "Precio inválido"),
  promo_price: z.coerce.number().min(0).optional(),
  availability: z.coerce.number().int().min(0, "Cantidad inválida"),
  status: z.enum(["disponible", "reservado", "vendido", "sin_stock"]),
  description: z.string().optional().or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")),
  internal_notes: z.string().optional().or(z.literal("")),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const taskSchema = z.object({
  title: z.string().min(2, "El título es obligatorio"),
  description: z.string().optional().or(z.literal("")),
  due_date: z.string().min(1, "Indicá la fecha"),
  due_time: z.string().optional().or(z.literal("")),
  priority: z.enum(["baja", "media", "alta"]),
  status: z.enum(["pendiente", "en_proceso", "completada", "vencida"]),
  assigned_user_id: z.string().optional().or(z.literal("")),
  lead_id: z.string().optional().or(z.literal("")),
});
export type TaskFormValues = z.infer<typeof taskSchema>;
