import type { User } from "@/types";
import { isOwnerAccount } from "@/lib/owner-accounts";

/**
 * Solo las cuentas de los dueños usan el WhatsApp real (Cloud API). Los
 * perfiles demo y las cuentas creadas desde /register ven conversaciones
 * simuladas: la demo pública no expone chats reales ni envía desde el número
 * de la empresa.
 */
export function usesRealWhatsApp(user: Pick<User, "id"> | null | undefined): boolean {
  return isOwnerAccount(user);
}
