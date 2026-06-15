import {
  format,
  formatDistanceToNow,
  isToday,
  isPast,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

export function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy · HH:mm", { locale: es });
  } catch {
    return "—";
  }
}

export function fromNow(value?: string | null) {
  if (!value) return "—";
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: es });
  } catch {
    return "—";
  }
}

export function isOverdue(value?: string | null) {
  if (!value) return false;
  try {
    const d = parseISO(value);
    return isPast(d) && !isToday(d);
  } catch {
    return false;
  }
}

export function isDueToday(value?: string | null) {
  if (!value) return false;
  try {
    return isToday(parseISO(value));
  } catch {
    return false;
  }
}

export function daysSince(value?: string | null) {
  if (!value) return 0;
  try {
    return Math.max(0, differenceInCalendarDays(new Date(), parseISO(value)));
  } catch {
    return 0;
  }
}
