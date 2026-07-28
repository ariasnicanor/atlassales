// ─────────────────────────────────────────────────────────────
// Atlas Sales OS — Modelo de dominio
// Estos tipos reflejan el schema de Supabase (ver /supabase/schema.sql)
// ─────────────────────────────────────────────────────────────

export type UUID = string;
export type ISODate = string;

export type UserRole = "admin" | "supervisor" | "vendedor" | "recepcion";

export type LeadStatus =
  | "nuevo"
  | "contactado"
  | "en_negociacion"
  | "proximo_a_vender"
  | "vendido"
  | "sin_gestion"
  | "cerrado"
  // Valores legacy tolerados para datos preexistentes.
  | "en_seguimiento"
  | "cotizado"
  | "negociacion"
  | "ganado"
  | "perdido";

export type Temperature = "frio" | "tibio" | "caliente";

export type ProductStatus =
  | "disponible"
  | "reservado"
  | "vendido"
  | "sin_stock";

export type ProductCondition = "nuevo" | "usado";

export type TaskStatus = "pendiente" | "en_proceso" | "completada" | "vencida";
export type TaskPriority = "baja" | "media" | "alta";

export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada";

export type TemplateCategory =
  | "primer_contacto"
  | "seguimiento"
  | "cotizacion"
  | "recuperacion";

export type PlanTier =
  | "core"
  | "growth"
  | "automation"
  | "ai_assist"
  | "ai_agent";

export interface Company {
  id: UUID;
  name: string;
  logo_url?: string | null;
  primary_color: string; // hex
  secondary_color: string; // hex
  industry: string;
  slogan?: string | null;
  active_plans: PlanTier[];
  created_at: ISODate;
}

export interface User {
  id: UUID;
  company_id: UUID;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  active: boolean;
  /** Solo relevante para vendedores. */
  supervisor_id?: UUID | null;
  /** Demo-only. En producción lo gestiona Supabase Auth. */
  password_hash?: string | null;
  /** Overrides por-usuario sobre la matriz de rol. */
  permission_overrides?: Partial<Record<string, string[]>>;
  /** Toggles finos por-usuario (Admin → Configuración → Funciones). true=habilitar, false=bloquear. */
  feature_overrides?: Record<string, boolean>;
  created_at: ISODate;
}

export interface AuditLogEntry {
  id: UUID;
  user_id: UUID | null;
  user_name: string;
  action: string;
  resource: string;
  resource_id?: string | null;
  meta?: string | null;
  created_at: ISODate;
}

export interface Client {
  id: UUID;
  company_id: UUID;
  name: string;
  phone?: string | null;
  email?: string | null;
  company_name?: string | null;
  city?: string | null;
  notes?: string | null;
  created_at: ISODate;
}

export interface Lead {
  id: UUID;
  company_id: UUID;
  assigned_user_id: UUID | null;
  client_id: UUID | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  source: string;
  status: LeadStatus;
  temperature: Temperature;
  product_interest?: string | null;
  next_contact_at?: ISODate | null;
  notes?: string | null;
  /** Última gestión registrada (mensaje, llamada, nota o cambio de estado). */
  last_management_at?: ISODate | null;
  /** Atribución de campaña (UTMs capturados al llegar el lead). */
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  landing_url?: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export type InteractionType =
  | "llamada"
  | "whatsapp"
  | "email"
  | "reunion"
  | "nota"
  | "cotizacion"
  | "cambio_estado";

export interface LeadInteraction {
  id: UUID;
  lead_id: UUID;
  user_id: UUID;
  type: InteractionType;
  note: string;
  created_at: ISODate;
}

export interface Product {
  id: UUID;
  company_id: UUID;
  name: string;
  brand: string;
  category: string;
  condition: ProductCondition; // nuevo | usado
  version?: string | null; // ej: "Exclusive 1.6 CVT"
  year?: number | null;
  mileage_km?: number | null; // para usados
  fuel?: string | null; // Nafta, Diésel, Híbrido, Eléctrico
  transmission?: string | null; // Manual, Automática, CVT
  list_price: number;
  promo_price?: number | null;
  availability: number; // units
  status: ProductStatus;
  description?: string | null;
  images: string[]; // galería de fotos
  image_url?: string | null; // legacy / portada
  internal_notes?: string | null;
  created_at: ISODate;
}

export interface Task {
  id: UUID;
  company_id: UUID;
  assigned_user_id: UUID | null;
  lead_id?: UUID | null;
  client_id?: UUID | null;
  title: string;
  description?: string | null;
  due_date: ISODate;
  due_time?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: ISODate;
}

export interface Quote {
  id: UUID;
  company_id: UUID;
  lead_id?: UUID | null;
  client_id?: UUID | null;
  product_id?: UUID | null;
  user_id: UUID;
  list_price: number;
  discount: number;
  expenses: number;
  trade_in_value?: number | null; // valor del usado entregado
  final_price: number;
  financing_summary?: string | null;
  status: QuoteStatus;
  created_at: ISODate;
}

export interface FinancialSimulation {
  id: UUID;
  company_id: UUID;
  lead_id?: UUID | null;
  product_id?: UUID | null;
  price: number;
  trade_in_value?: number | null; // valor del usado entregado (cuenta como anticipo)
  down_payment: number;
  financed_amount: number;
  term_months: number;
  rate: number; // annual nominal rate, e.g. 0.45
  estimated_payment: number;
  created_at: ISODate;
}

export interface Sale {
  id: UUID;
  company_id: UUID;
  lead_id?: UUID | null;
  client_id?: UUID | null;
  product_id?: UUID | null;
  user_id: UUID;
  amount: number;
  commission_amount: number;
  created_at: ISODate;
}

export interface Goal {
  id: UUID;
  company_id: UUID;
  user_id: UUID | null; // null => team goal
  period: string; // YYYY-MM
  target_amount: number;
  target_units: number;
  created_at: ISODate;
}

export interface MessageTemplate {
  id: UUID;
  company_id: UUID;
  title: string;
  category: TemplateCategory;
  body: string;
  created_at: ISODate;
}

export type AutomationTrigger =
  | "lead_creado"
  | "lead_cotizado"
  | "sin_respuesta"
  | "cotizacion_aceptada"
  | "lead_caliente";

export type AutomationAction =
  | "crear_recordatorio"
  | "crear_tarea"
  | "cambiar_estado"
  | "asignar_vendedor"
  | "notificar";

export interface AutomationRule {
  id: UUID;
  company_id: UUID;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  active: boolean;
  created_at: ISODate;
}

export interface AiLeadScore {
  id: UUID;
  lead_id: UUID;
  score: number; // 0-100
  classification: Temperature;
  reasons: string[];
  recommended_action: string;
  created_at: ISODate;
}

export type LeadDistributionMode = "round_robin" | "manual" | "rules";

export interface LeadDistributionRule {
  id: UUID;
  /** Campo del lead a evaluar. */
  field: "source" | "product_interest" | "utm_campaign";
  /** Match case-insensitive por "contiene". */
  match: string;
  /** Vendedor destino. */
  user_id: UUID;
}

export interface LeadDistributionConfig {
  mode: LeadDistributionMode;
  /** Cola de round-robin (últimos asignados). Se rota internamente. */
  rr_pointer: number;
  /** Reglas ordenadas: primera que matchea gana. */
  rules: LeadDistributionRule[];
  /** Fallback si ninguna regla matchea o no hay vendedores activos. */
  fallback_user_id: UUID | null;
}

export interface DataState {
  company: Company;
  users: User[];
  clients: Client[];
  leads: Lead[];
  interactions: LeadInteraction[];
  products: Product[];
  tasks: Task[];
  quotes: Quote[];
  simulations: FinancialSimulation[];
  sales: Sale[];
  goals: Goal[];
  templates: MessageTemplate[];
  automationRules: AutomationRule[];
  aiScores: AiLeadScore[];
  auditLog: AuditLogEntry[];
  leadDistribution: LeadDistributionConfig;
}

