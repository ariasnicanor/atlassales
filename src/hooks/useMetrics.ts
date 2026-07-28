import { useMemo } from "react";
import { useScopedData } from "./useScopedData";
import { isOverdue, daysSince } from "@/lib/date";
import { parseISO } from "date-fns";
import type { Lead } from "@/types";

function isThisMonth(iso: string) {
  const d = parseISO(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function useMetrics() {
  const { leads, tasks, quotes, sales } = useScopedData();

  return useMemo(() => {
    const leadsNuevos = leads.filter((l) => l.status === "nuevo").length;
    const enSeguimiento = leads.filter((l) =>
      ["contactado", "en_negociacion", "proximo_a_vender"].includes(l.status)
    ).length;
    const calientes = leads.filter(
      (l) => l.temperature === "caliente" && !["vendido", "cerrado"].includes(l.status)
    ).length;

    const tareasVencidas = tasks.filter(
      (t) => t.status !== "completada" && isOverdue(t.due_date)
    ).length;

    const cotizacionesPendientes = quotes.filter((q) =>
      ["borrador", "enviada"].includes(q.status)
    ).length;

    const ventasMes = sales.filter((s) => isThisMonth(s.created_at));
    const ventasCerradasMes = ventasMes.length;
    const montoVendidoMes = ventasMes.reduce((acc, s) => acc + s.amount, 0);

    const cerrados = leads.filter((l) => ["vendido", "cerrado"].includes(l.status));
    const ganados = leads.filter((l) => l.status === "vendido");
    const conversion = cerrados.length ? ganados.length / cerrados.length : 0;

    // Leads que necesitan atención (motor de "seguimiento optimizado")
    const needsAttention: { lead: Lead; reason: string }[] = [];
    leads.forEach((l) => {
      if (["vendido", "cerrado"].includes(l.status)) return;
      if (l.status === "nuevo") {
        needsAttention.push({ lead: l, reason: "Lead nuevo sin contactar" });
      } else if (l.next_contact_at && isOverdue(l.next_contact_at)) {
        needsAttention.push({ lead: l, reason: "Seguimiento vencido" });
      } else if (l.temperature === "caliente" && daysSince(l.updated_at) >= 2) {
        needsAttention.push({ lead: l, reason: "Lead caliente sin actividad" });
      } else if (l.status === "proximo_a_vender" && daysSince(l.updated_at) >= 2) {
        needsAttention.push({ lead: l, reason: "Próximo a vender sin respuesta" });
      } else if (l.status === "sin_gestion") {
        needsAttention.push({ lead: l, reason: "Lead sin gestión, retomar contacto" });
      }
    });

    const hotLeads = leads
      .filter((l) => l.temperature === "caliente" && !["vendido", "cerrado"].includes(l.status))
      .slice(0, 6);

    return {
      leadsNuevos,
      enSeguimiento,
      calientes,
      tareasVencidas,
      cotizacionesPendientes,
      ventasCerradasMes,
      montoVendidoMes,
      conversion,
      needsAttention: needsAttention.slice(0, 8),
      hotLeads,
      totalLeads: leads.length,
    };
  }, [leads, tasks, quotes, sales]);
}
