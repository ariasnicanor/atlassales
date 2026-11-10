import type { User } from "@/types";

/**
 * Cuentas de los dueños (Nicanor y Moises). Son las únicas que operan el
 * WhatsApp real de la empresa y no se puede "saltar" a ellas desde un perfil
 * demo con el selector de usuarios (que no pide contraseña).
 *
 * Es un filtro de interfaz para la demo pública: la protección real llega con
 * Supabase Auth (Grupo C). Hasta entonces, el backend se apoya en el shared
 * secret + rate limiting de las Edge Functions.
 */
export const OWNER_ACCOUNT_IDS = new Set(["user_nicanor", "user_moises"]);

export function isOwnerAccount(user: Pick<User, "id"> | null | undefined): boolean {
  return Boolean(user && OWNER_ACCOUNT_IDS.has(user.id));
}
