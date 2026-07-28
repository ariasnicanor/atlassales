import type { User, UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────
// Matriz de permisos granular por recurso × acción
// ─────────────────────────────────────────────────────────────

export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "assign"
  | "reassign"
  | "approve"
  | "export"
  | "manage";

export type Resource =
  | "leads"
  | "clients"
  | "products"
  | "stock"
  | "prices"
  | "quotes"
  | "financing"
  | "tasks"
  | "goals"
  | "commissions"
  | "users"
  | "reports"
  | "dashboard"
  | "crm_config"
  | "sources"
  | "settings"
  | "audit"
  | "company";

const ALL: Action[] = [
  "view",
  "create",
  "edit",
  "delete",
  "assign",
  "reassign",
  "approve",
  "export",
  "manage",
];

/**
 * Defaults por rol. Cada vendedor / supervisor ve datos filtrados por scope
 * en `useScopedData` — la matriz define QUÉ acciones puede hacer, no sobre
 * qué filas.
 */
export const ROLE_MATRIX: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  vendedor: {
    dashboard: ["view"],
    leads: ["view", "create", "edit"],
    clients: ["view", "create", "edit"],
    tasks: ["view", "create", "edit", "delete"],
    quotes: ["view", "create", "edit"],
    financing: ["view", "create"],
    products: ["view"],
    stock: ["view"],
    prices: ["view"],
    goals: ["view"],
    commissions: ["view"],
    settings: ["view"],
  },
  supervisor: {
    dashboard: ["view"],
    leads: ["view", "create", "edit", "assign", "reassign", "export"],
    clients: ["view", "create", "edit", "export"],
    tasks: ["view", "create", "edit", "delete", "assign"],
    quotes: ["view", "create", "edit", "approve"],
    financing: ["view", "create"],
    products: ["view"],
    stock: ["view"],
    prices: ["view"],
    goals: ["view", "edit"],
    commissions: ["view", "export"],
    reports: ["view", "export"],
    users: ["view"],
    settings: ["view"],
  },
  recepcion: {
    dashboard: ["view"],
    leads: ["view", "create", "assign", "reassign"],
    clients: ["view", "create"],
    tasks: ["view", "create"],
    products: ["view"],
    stock: ["view"],
    settings: ["view"],
  },
  admin: {
    dashboard: ALL,
    leads: ALL,
    clients: ALL,
    tasks: ALL,
    quotes: ALL,
    financing: ALL,
    products: ALL,
    stock: ALL,
    prices: ALL,
    goals: ALL,
    commissions: ALL,
    reports: ALL,
    users: ALL,
    crm_config: ALL,
    sources: ALL,
    settings: ALL,
    audit: ["view", "export"],
    company: ALL,
  },
};

// ─────────────────────────────────────────────────────────────
// Legacy permission enum (mantiene código existente funcionando)
// ─────────────────────────────────────────────────────────────

export type Permission =
  | "manage_users"
  | "manage_company"
  | "view_all_leads"
  | "assign_leads"
  | "view_reports"
  | "view_team"
  | "manage_products"
  | "view_commissions_all";

const LEGACY_MAP: Record<Permission, [Action, Resource]> = {
  manage_users: ["manage", "users"],
  manage_company: ["manage", "company"],
  view_all_leads: ["view", "leads"], // scope se aplica en useScopedData
  assign_leads: ["assign", "leads"],
  view_reports: ["view", "reports"],
  view_team: ["view", "users"],
  manage_products: ["manage", "products"],
  view_commissions_all: ["export", "commissions"],
};

// ─────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────

export function can(user: User | null | undefined, permission: Permission): boolean;
export function can(user: User | null | undefined, action: Action, resource: Resource): boolean;
export function can(
  user: User | null | undefined,
  a: Permission | Action,
  b?: Resource
): boolean {
  if (!user) return false;

  let action: Action;
  let resource: Resource;
  if (b === undefined) {
    const mapped = LEGACY_MAP[a as Permission];
    if (!mapped) return false;
    [action, resource] = mapped;
  } else {
    action = a as Action;
    resource = b;
  }

  // 1) Overrides por usuario (opcionales)
  const overrides = user.permission_overrides?.[resource];
  if (overrides && overrides.includes(action)) return true;

  // 2) Defaults por rol
  const perms = ROLE_MATRIX[user.role]?.[resource];
  if (!perms) return false;
  if (perms.includes("manage")) return true;
  return perms.includes(action);
}

export function roleLabel(role: UserRole) {
  return { admin: "Admin", supervisor: "Supervisor", vendedor: "Vendedor" }[role];
}

/** Ámbito de datos que ve el usuario ("own" | "team" | "all"). */
export function dataScope(user: User | null | undefined): "none" | "own" | "team" | "all" {
  if (!user) return "none";
  if (user.role === "admin") return "all";
  if (user.role === "supervisor") return "team";
  return "own";
}

/** Devuelve los user IDs cuyas filas puede ver `user` (team scope). */
export function teamMemberIds(user: User, allUsers: User[]): string[] {
  const ids = allUsers.filter((u) => u.supervisor_id === user.id).map((u) => u.id);
  ids.push(user.id);
  return ids;
}

export function canSeeOwned(user: User | null, ownerId: string | null) {
  if (!user) return false;
  const scope = dataScope(user);
  if (scope === "all") return true;
  if (scope === "own") return user.id === ownerId;
  return true; // team scope: llamador ya filtró
}
