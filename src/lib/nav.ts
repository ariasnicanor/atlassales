import {
  LayoutDashboard,
  Flame,
  Contact,
  Package,
  CheckSquare,
  UsersRound,
  BarChart3,
  Settings,
  Calculator,
  FileText,
  Percent,
  Target,
  Trophy,
  MessageSquareText,
  Zap,
  Sparkles,
  Bot,
  type LucideIcon,
} from "lucide-react";
import type { PlanTier } from "@/types";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  moduleKey: string;
  tier: PlanTier;
}

export interface NavSection {
  title: string;
  tier: PlanTier;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core",
    tier: "core",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard", tier: "core" },
      { label: "Leads", path: "/leads", icon: Flame, moduleKey: "leads", tier: "core" },
      { label: "Clientes", path: "/clients", icon: Contact, moduleKey: "clients", tier: "core" },
      { label: "Stock", path: "/stock", icon: Package, moduleKey: "stock", tier: "core" },
      { label: "Tareas", path: "/tasks", icon: CheckSquare, moduleKey: "tasks", tier: "core" },
      { label: "Usuarios", path: "/users", icon: UsersRound, moduleKey: "users", tier: "core" },
      { label: "Reportes", path: "/reports", icon: BarChart3, moduleKey: "reports", tier: "core" },
      { label: "Branding", path: "/settings", icon: Settings, moduleKey: "settings", tier: "core" },
    ],
  },
  {
    title: "Growth",
    tier: "growth",
    items: [
      { label: "Simulador", path: "/growth/simulator", icon: Calculator, moduleKey: "simulator", tier: "growth" },
      { label: "Cotizador", path: "/growth/quoter", icon: FileText, moduleKey: "quoter", tier: "growth" },
      { label: "Comisiones", path: "/growth/commissions", icon: Percent, moduleKey: "commissions", tier: "growth" },
      { label: "Objetivos", path: "/growth/goals", icon: Target, moduleKey: "goals", tier: "growth" },
      { label: "Ranking", path: "/growth/ranking", icon: Trophy, moduleKey: "ranking", tier: "growth" },
      { label: "Plantillas", path: "/growth/templates", icon: MessageSquareText, moduleKey: "templates", tier: "growth" },
    ],
  },
  {
    title: "Premium",
    tier: "automation",
    items: [
      { label: "Automation", path: "/automation", icon: Zap, moduleKey: "automation", tier: "automation" },
      { label: "AI Assist", path: "/ai-assist", icon: Sparkles, moduleKey: "ai-assist", tier: "ai_assist" },
      { label: "AI Agent", path: "/ai-agent", icon: Bot, moduleKey: "ai-agent", tier: "ai_agent" },
    ],
  },
];
