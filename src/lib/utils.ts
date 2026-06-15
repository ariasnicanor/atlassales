import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conditional logic (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Argentine Peso currency. */
export function formatCurrency(value: number | null | undefined, currency = "ARS") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact number formatting (e.g. 12.5k). */
export function formatCompact(value: number) {
  return new Intl.NumberFormat("es-AR", { notation: "compact" }).format(value);
}

/** Percentage with one decimal. */
export function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

/** Get initials from a full name. */
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

/** Stable pseudo-random id. */
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
