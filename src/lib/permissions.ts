import type { User, UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────
// Permisos por rol (Core)
// Admin: ve todo, gestiona usuarios, configura empresa
// Supervisor: ve equipo, ve reportes, asigna leads
// Vendedor: ve sus leads / tareas / pipeline
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

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "manage_users",
    "manage_company",
    "view_all_leads",
    "assign_leads",
    "view_reports",
    "view_team",
    "manage_products",
    "view_commissions_all",
  ],
  supervisor: [
    "view_all_leads",
    "assign_leads",
    "view_reports",
    "view_team",
    "view_commissions_all",
  ],
  vendedor: [],
};

export function can(user: User | null | undefined, permission: Permission) {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function roleLabel(role: UserRole) {
  return { admin: "Admin", supervisor: "Supervisor", vendedor: "Vendedor" }[role];
}

/** Whether `user` can see records owned by `ownerId`. */
export function canSeeOwned(user: User | null, ownerId: string | null) {
  if (!user) return false;
  if (can(user, "view_all_leads")) return true;
  return user.id === ownerId;
}
