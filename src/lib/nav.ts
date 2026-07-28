import {
  LayoutDashboard,
  Flame,
  Package,
  CalendarDays,
  CheckSquare,
  Contact,
  UsersRound,
  BarChart3,
  ShieldCheck,
  Settings,
  Calculator,
  FileText,
  Percent,
  Target,
  Trophy,
  MessageSquareText,
  MessageCircle,
  Repeat2,
  Zap,
  Sparkles,
  Bot,
  Plus,
  Upload,
  type LucideIcon,
} from "lucide-react";
import type { PlanTier, User, UserRole } from "@/types";
import { hasFeature } from "@/lib/features";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  moduleKey: string;
  tier: PlanTier;
  /** Si se define, solo estos roles ven el item. Si no, todos. */
  roles?: UserRole[];
  /** Feature toggle opcional (Admin puede des/habilitar por usuario). */
  feature?: string;
}

/** Barra inferior fija (mobile) — igual para todos los roles. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard", tier: "core" },
  { label: "Leads", path: "/leads", icon: Flame, moduleKey: "leads", tier: "core" },
  { label: "Stock", path: "/stock", icon: Package, moduleKey: "stock", tier: "core" },
  { label: "Tareas", path: "/tasks", icon: CheckSquare, moduleKey: "tasks", tier: "core" },
];

/** Acciones del botón "+" central. */
export interface CreateAction {
  label: string;
  path: string;
  icon: LucideIcon;
  tier: PlanTier;
}
export const CREATE_ACTIONS: CreateAction[] = [
  { label: "Nuevo lead", path: "/leads/new", icon: Flame, tier: "core" },
  { label: "Nueva tarea", path: "/tasks?nueva=1", icon: CheckSquare, tier: "core" },
  { label: "Nueva cotización", path: "/growth/quoter", icon: FileText, tier: "growth" },
  { label: "Nueva simulación", path: "/growth/simulator", icon: Calculator, tier: "growth" },
];

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Contenido del menú "Más" (sheet). Items filtrados por rol y plan. */
export const MORE_GROUPS: NavGroup[] = [
  {
    title: "Gestión",
    items: [
      { label: "Calendario", path: "/calendar", icon: CalendarDays, moduleKey: "calendar", tier: "core" },
      { label: "Remarketing", path: "/remarketing", icon: Repeat2, moduleKey: "remarketing", tier: "core" },
      { label: "Reportes", path: "/reports", icon: BarChart3, moduleKey: "reports", tier: "core", roles: ["admin", "supervisor"], feature: "view_reports" },
      { label: "Usuarios", path: "/users", icon: UsersRound, moduleKey: "users", tier: "core", roles: ["admin", "supervisor"] },
      { label: "Clientes", path: "/clients", icon: Contact, moduleKey: "clients", tier: "core", roles: ["admin"] },
      { label: "Auditoría", path: "/audit", icon: ShieldCheck, moduleKey: "audit", tier: "core", roles: ["admin"], feature: "view_audit" },
      { label: "Configuración", path: "/settings", icon: Settings, moduleKey: "settings", tier: "core", roles: ["admin", "supervisor", "vendedor", "recepcion"] },
    ],
  },
  {
    title: "Canales",
    items: [
      { label: "WhatsApp", path: "/whatsapp", icon: MessageCircle, moduleKey: "whatsapp", tier: "core", feature: "whatsapp" },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "Cotizador", path: "/growth/quoter", icon: FileText, moduleKey: "quoter", tier: "growth" },
      { label: "Simulador", path: "/growth/simulator", icon: Calculator, moduleKey: "simulator", tier: "growth" },
      { label: "Comisiones", path: "/growth/commissions", icon: Percent, moduleKey: "commissions", tier: "growth", roles: ["admin", "supervisor"] },
      { label: "Objetivos", path: "/growth/goals", icon: Target, moduleKey: "goals", tier: "growth" },
      { label: "Ranking", path: "/growth/ranking", icon: Trophy, moduleKey: "ranking", tier: "growth" },
      { label: "Plantillas", path: "/growth/templates", icon: MessageSquareText, moduleKey: "templates", tier: "growth" },
    ],
  },
  {
    title: "Premium",
    items: [
      { label: "Automation", path: "/automation", icon: Zap, moduleKey: "automation", tier: "automation" },
      { label: "AI Assist", path: "/ai-assist", icon: Sparkles, moduleKey: "ai-assist", tier: "ai_assist" },
      { label: "AI Agent", path: "/ai-agent", icon: Bot, moduleKey: "ai-agent", tier: "ai_agent" },
    ],
  },
];

/** Filtra un item por rol. */
export function itemAllowed(item: NavItem, role: UserRole | undefined) {
  if (!item.roles) return true;
  return role ? item.roles.includes(role) : false;
}

/** Filtra por rol + feature toggle (Admin puede bloquear features por usuario). */
export function itemAllowedForUser(item: NavItem, user: User | null | undefined) {
  if (!itemAllowed(item, user?.role)) return false;
  if (item.feature && !hasFeature(user, item.feature)) return false;
  return true;
}

export { Plus };

// ============================================================
//  Navegación agrupada por PERFIL (rol del usuario)
// ============================================================

const ROLE_LABEL: Record<UserRole, string> = {
  vendedor: "Vendedor",
  recepcion: "Recepción",
  supervisor: "Supervisor",
  admin: "Admin",
};

/** Ítem extra: Importar leads (gated por feature). */
const IMPORT_LEADS: NavItem = {
  label: "Importar leads",
  path: "/leads/import",
  icon: Upload,
  moduleKey: "leads",
  tier: "core",
  roles: ["admin", "supervisor"],
  feature: "import_leads",
};

/** Orden preferido de herramientas por perfil (paths). */
const PROFILE_ORDER: Record<UserRole, string[]> = {
  vendedor: [
    "/dashboard",
    "/leads",
    "/whatsapp",
    "/tasks",
    "/calendar",
    "/stock",
    "/growth/quoter",
    "/growth/simulator",
    "/growth/templates",
    "/growth/goals",
    "/growth/ranking",
    "/settings",
  ],
  recepcion: [
    "/leads",
    "/remarketing",
    "/stock",
    "/calendar",
    "/tasks",
    "/growth/templates",
    "/whatsapp",
    "/settings",
  ],
  supervisor: [
    "/dashboard",
    "/leads",
    "/leads/import",
    "/remarketing",
    "/whatsapp",
    "/tasks",
    "/calendar",
    "/stock",
    "/users",
    "/reports",
    "/growth/quoter",
    "/growth/simulator",
    "/growth/goals",
    "/growth/ranking",
    "/growth/commissions",
    "/growth/templates",
    "/settings",
  ],
  admin: [
    "/dashboard",
    "/leads",
    "/leads/import",
    "/remarketing",
    "/whatsapp",
    "/tasks",
    "/calendar",
    "/stock",
    "/clients",
    "/users",
    "/reports",
    "/audit",
    "/growth/quoter",
    "/growth/simulator",
    "/growth/goals",
    "/growth/ranking",
    "/growth/commissions",
    "/growth/templates",
    "/automation",
    "/ai-assist",
    "/ai-agent",
    "/settings",
  ],
};

/** Devuelve las herramientas visibles agrupadas bajo el perfil del usuario. */
export function getProfileSections(user: User | null | undefined): NavGroup[] {
  if (!user) return [];
  const allItems: NavItem[] = [
    ...PRIMARY_NAV,
    IMPORT_LEADS,
    ...MORE_GROUPS.flatMap((g) => g.items),
  ];
  const byPath = new Map(allItems.map((i) => [i.path, i]));
  const order = PROFILE_ORDER[user.role] ?? [];
  const items: NavItem[] = [];
  for (const path of order) {
    const it = byPath.get(path);
    if (it && itemAllowedForUser(it, user)) items.push(it);
  }
  if (items.length === 0) return [];
  return [{ title: `Perfil ${ROLE_LABEL[user.role]}`, items }];
}

