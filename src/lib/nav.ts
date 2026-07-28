import {
  LayoutDashboard,
  Flame,
  Package,
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
      { label: "Reportes", path: "/reports", icon: BarChart3, moduleKey: "reports", tier: "core", roles: ["admin", "supervisor"], feature: "view_reports" },
      { label: "Usuarios", path: "/users", icon: UsersRound, moduleKey: "users", tier: "core", roles: ["admin", "supervisor"] },
      { label: "Clientes", path: "/clients", icon: Contact, moduleKey: "clients", tier: "core", roles: ["admin"] },
      { label: "Auditoría", path: "/audit", icon: ShieldCheck, moduleKey: "audit", tier: "core", roles: ["admin"], feature: "view_audit" },
      { label: "Configuración", path: "/settings", icon: Settings, moduleKey: "settings", tier: "core", roles: ["admin", "supervisor", "vendedor"] },
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
