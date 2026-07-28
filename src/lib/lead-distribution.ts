import type { Lead, LeadDistributionConfig, User } from "@/types";

/** Vendedores activos (rol vendedor + active=true). */
export function activeSellers(users: User[]): User[] {
  return users.filter((u) => u.role === "vendedor" && u.active);
}

export interface AssignResult {
  user_id: string | null;
  next_pointer: number;
  reason: "manual" | "rule" | "round_robin" | "fallback" | "none";
}

/**
 * Decide a quién asignar un lead entrante según la configuración.
 * NO muta el config; devuelve el nuevo puntero para round-robin.
 */
export function pickAssignee(
  input: Partial<Lead>,
  config: LeadDistributionConfig,
  users: User[]
): AssignResult {
  const sellers = activeSellers(users);
  const fallback = config.fallback_user_id;

  if (config.mode === "manual") {
    // Solo respeta lo que venga en input; si no vino, deja sin asignar (o fallback si está seteado).
    return {
      user_id: fallback,
      next_pointer: config.rr_pointer,
      reason: fallback ? "fallback" : "none",
    };
  }

  if (config.mode === "rules") {
    for (const r of config.rules) {
      const raw = (input[r.field] as string | null | undefined) ?? "";
      if (!raw) continue;
      if (raw.toLowerCase().includes(r.match.toLowerCase())) {
        // Verificar que el user siga activo.
        const target = users.find((u) => u.id === r.user_id && u.active);
        if (target) {
          return { user_id: target.id, next_pointer: config.rr_pointer, reason: "rule" };
        }
      }
    }
    // Sin match: cae a fallback.
    return {
      user_id: fallback,
      next_pointer: config.rr_pointer,
      reason: fallback ? "fallback" : "none",
    };
  }

  // round_robin
  if (sellers.length === 0) {
    return {
      user_id: fallback,
      next_pointer: config.rr_pointer,
      reason: fallback ? "fallback" : "none",
    };
  }
  const idx = ((config.rr_pointer % sellers.length) + sellers.length) % sellers.length;
  const target = sellers[idx];
  return {
    user_id: target.id,
    next_pointer: (idx + 1) % sellers.length,
    reason: "round_robin",
  };
}
