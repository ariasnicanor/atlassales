import type { PlanTier } from "@/types";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  tagline: string;
  /** Commercial positioning, kept as an editable variable (no fixed price). */
  priceHint: string;
  highlight: boolean;
  features: string[];
}

export const PLANS: PlanDefinition[] = [
  {
    tier: "core",
    name: "Plan Core",
    tagline: "El sistema base para que tu equipo venda ordenado.",
    priceHint: "Plan inicial",
    highlight: false,
    features: [
      "Dashboard comercial",
      "Leads y pipeline",
      "Clientes",
      "Stock / productos",
      "Tareas y seguimiento",
      "Usuarios y roles",
      "Reportes básicos",
      "Branding de empresa",
    ],
  },
  {
    tier: "growth",
    name: "Plan Growth",
    tagline: "Más cotizaciones, más velocidad, más cierres.",
    priceHint: "Plan medio",
    highlight: true,
    features: [
      "Simulador financiero",
      "Cotizador integrado",
      "Comisiones",
      "Objetivos",
      "Ranking de vendedores",
      "Plantillas comerciales",
      "Seguimiento optimizado",
    ],
  },
  {
    tier: "automation",
    name: "Plan Automation",
    tagline: "Menos tareas repetitivas. Más capacidad operativa.",
    priceHint: "Plan avanzado",
    highlight: false,
    features: [
      "Recordatorios automáticos",
      "Seguimientos automáticos",
      "Automatización de tareas",
      "Automatización de estados",
      "Integraciones con formularios",
      "Asignación automática de leads",
    ],
  },
  {
    tier: "ai_assist",
    name: "Plan AI Assist",
    tagline: "Tu copiloto comercial para decidir mejor.",
    priceHint: "Adicional premium",
    highlight: false,
    features: [
      "Resumen automático de conversaciones",
      "Clasificación de leads",
      "Priorización de oportunidades",
      "Recomendaciones de seguimiento",
      "Análisis comercial asistido",
    ],
  },
  {
    tier: "ai_agent",
    name: "Plan AI Agent",
    tagline: "Un agente que califica y te entrega leads listos.",
    priceHint: "Plan enterprise",
    highlight: false,
    features: [
      "Agente comercial IA",
      "Primer contacto automático",
      "Calificación de leads",
      "Recolección de información",
      "Agenda de reuniones",
      "Derivación inteligente al vendedor",
    ],
  },
];

export const PLAN_BY_TIER: Record<PlanTier, PlanDefinition> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.tier]: p }),
  {} as Record<PlanTier, PlanDefinition>
);

/** Maps a route/module key to the plan tier that unlocks it. */
export const MODULE_TIER: Record<string, PlanTier> = {
  dashboard: "core",
  leads: "core",
  clients: "core",
  stock: "core",
  tasks: "core",
  users: "core",
  reports: "core",
  settings: "core",
  growth: "growth",
  simulator: "growth",
  quoter: "growth",
  commissions: "growth",
  goals: "growth",
  ranking: "growth",
  templates: "growth",
  automation: "automation",
  "ai-assist": "ai_assist",
  "ai-agent": "ai_agent",
};
