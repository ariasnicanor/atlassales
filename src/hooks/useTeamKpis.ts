import { useMemo } from "react";
import { parseISO } from "date-fns";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { dataScope, teamMemberIds } from "@/lib/permissions";
import type { Lead, LeadInteraction, User } from "@/types";

const CONTACTED_STATUSES = [
  "contactado",
  "en_negociacion",
  "proximo_a_vender",
  "vendido",
  "cerrado",
  "remarketing",
];

export interface SellerKpi {
  user: User;
  leads: number;
  contactados: number;
  contactRate: number;
  ventasConfirmadas: number;
  ventasSolicitadas: number;
  confirmRate: number;
  /** Horas promedio entre la creación del lead y el primer contacto. */
  avgContactHours: number | null;
}

function firstContactAt(leadId: string, interactions: LeadInteraction[]) {
  const real = interactions
    .filter((i) => i.lead_id === leadId && i.type !== "cambio_estado" && i.type !== "nota")
    .map((i) => parseISO(i.created_at).getTime())
    .sort((a, b) => a - b);
  return real[0] ?? null;
}

function isContacted(lead: Lead, firstMs: number | null) {
  return firstMs !== null || CONTACTED_STATUSES.includes(lead.status);
}

/**
 * KPIs de equipo para supervisor / administrador:
 * leads por vendedor, % contactados, % ventas confirmadas y tiempo promedio de contacto.
 */
export function useTeamKpis() {
  const data = useData();
  const { currentUser } = useSession();

  return useMemo(() => {
    const scope = dataScope(currentUser);
    const canSeeTeam = scope === "all" || scope === "team";
    if (!currentUser || !canSeeTeam) {
      return { enabled: false, sellers: [] as SellerKpi[], totals: null };
    }

    const memberIds =
      scope === "all"
        ? data.users.map((u) => u.id)
        : teamMemberIds(currentUser, data.users);
    const memberSet = new Set(memberIds);

    const sellers: SellerKpi[] = data.users
      .filter((u) => memberSet.has(u.id) && u.role !== "admin")
      .map((u) => {
        const leads = data.leads.filter((l) => l.assigned_user_id === u.id);
        let contactados = 0;
        const deltas: number[] = [];

        leads.forEach((l) => {
          const firstMs = firstContactAt(l.id, data.interactions);
          if (isContacted(l, firstMs)) contactados += 1;
          if (firstMs !== null) {
            const created = parseISO(l.created_at).getTime();
            const diff = (firstMs - created) / 36e5;
            if (diff >= 0) deltas.push(diff);
          }
        });

        const requests = (data.saleConfirmations ?? []).filter((s) => s.requested_by === u.id);
        const confirmadas = requests.filter((s) => s.status === "confirmada").length;

        return {
          user: u,
          leads: leads.length,
          contactados,
          contactRate: leads.length ? contactados / leads.length : 0,
          ventasConfirmadas: confirmadas,
          ventasSolicitadas: requests.length,
          confirmRate: requests.length ? confirmadas / requests.length : 0,
          avgContactHours: deltas.length
            ? deltas.reduce((a, b) => a + b, 0) / deltas.length
            : null,
        };
      })
      .sort((a, b) => b.leads - a.leads);

    const totalLeads = sellers.reduce((a, s) => a + s.leads, 0);
    const totalContactados = sellers.reduce((a, s) => a + s.contactados, 0);
    const totalConfirmadas = sellers.reduce((a, s) => a + s.ventasConfirmadas, 0);
    const totalSolicitadas = sellers.reduce((a, s) => a + s.ventasSolicitadas, 0);
    const withAvg = sellers.filter((s) => s.avgContactHours !== null);

    return {
      enabled: true,
      sellers,
      totals: {
        leads: totalLeads,
        contactRate: totalLeads ? totalContactados / totalLeads : 0,
        confirmRate: totalSolicitadas ? totalConfirmadas / totalSolicitadas : 0,
        ventasConfirmadas: totalConfirmadas,
        ventasSolicitadas: totalSolicitadas,
        avgContactHours: withAvg.length
          ? withAvg.reduce((a, s) => a + (s.avgContactHours ?? 0), 0) / withAvg.length
          : null,
      },
    };
  }, [data.users, data.leads, data.interactions, data.saleConfirmations, currentUser]);
}

export function formatContactTime(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}
