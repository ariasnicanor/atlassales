import type { Lead, LeadStatus } from "@/types";
import { daysSince } from "./date";

/** Estados considerados "finales" — no reciben auto-cierre. */
export const CLOSED_STATUSES: LeadStatus[] = ["vendido", "cerrado", "ganado", "perdido"];

/** Estados abiertos del nuevo pipeline (excluye legacy). */
export const OPEN_PIPELINE: LeadStatus[] = [
  "nuevo",
  "contactado",
  "en_negociacion",
  "proximo_a_vender",
];

/** Días sin gestión configurados para auto-cierre. */
export const AUTO_CLOSE_DAYS = 30;

/** Devuelve la fecha base para calcular gestión (último toque o creación). */
export function lastManagementDate(lead: Lead): string {
  return lead.last_management_at ?? lead.updated_at ?? lead.created_at;
}

/** Cantidad de días sin ninguna gestión sobre el lead. */
export function daysWithoutManagement(lead: Lead): number {
  return daysSince(lastManagementDate(lead));
}

export type StaleTone = "fresh" | "warning" | "danger";

/** Devuelve tono e info visual sobre la antigüedad de la gestión. */
export function stalenessInfo(days: number): {
  tone: StaleTone;
  label: string;
  className: string;
  dotClass: string;
} {
  if (days >= 20) {
    return {
      tone: "danger",
      label: `${days}d sin gestión · próximo a cerrarse`,
      className: "text-destructive",
      dotClass: "bg-rose-500",
    };
  }
  if (days >= 7) {
    return {
      tone: "warning",
      label: `${days}d sin gestión`,
      className: "text-amber-600 dark:text-amber-400",
      dotClass: "bg-amber-500",
    };
  }
  return {
    tone: "fresh",
    label: days === 0 ? "Gestionado hoy" : `${days}d sin gestión`,
    className: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  };
}

/** ¿El lead está cerrado (vendido o cerrado por inactividad)? */
export function isClosed(lead: Lead): boolean {
  return CLOSED_STATUSES.includes(lead.status);
}
