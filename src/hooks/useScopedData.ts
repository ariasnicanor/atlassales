import { useMemo } from "react";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { dataScope, teamMemberIds } from "@/lib/permissions";

/**
 * Datos filtrados según el rol:
 * - admin        → todo.
 * - supervisor   → datos de los vendedores asignados (supervisor_id === user.id) + propios.
 * - vendedor     → solo propio.
 */
export function useScopedData() {
  const data = useData();
  const { currentUser } = useSession();

  return useMemo(() => {
    const scope = dataScope(currentUser);
    const seeAll = scope === "all";

    if (seeAll || !currentUser) {
      return {
        leads: data.leads,
        tasks: data.tasks,
        quotes: data.quotes,
        sales: data.sales,
        interactions: data.interactions,
        simulations: data.simulations,
        seeAll,
      };
    }

    const allowedIds =
      scope === "team"
        ? new Set(teamMemberIds(currentUser, data.users))
        : new Set([currentUser.id]);

    // Recepción y Supervisor además ven los contactos sin responsable
    // (típicamente los que cayeron a Remarketing) para poder asignarlos.
    const seesUnassigned =
      currentUser.role === "recepcion" || currentUser.role === "supervisor";
    // Recepción ve TODA la bandeja de Remarketing, no solo la propia.
    const seesAllRemarketing = currentUser.role === "recepcion";

    return {
      leads: data.leads.filter((l) => {
        if (seesAllRemarketing && l.status === "remarketing") return true;
        return l.assigned_user_id ? allowedIds.has(l.assigned_user_id) : seesUnassigned;
      }),
      tasks: data.tasks.filter((t) => t.assigned_user_id && allowedIds.has(t.assigned_user_id)),

      quotes: data.quotes.filter((q) => allowedIds.has(q.user_id)),
      sales: data.sales.filter((s) => allowedIds.has(s.user_id)),
      interactions: data.interactions.filter((i) => allowedIds.has(i.user_id)),
      simulations: data.simulations,
      seeAll,
    };
  }, [
    data.leads,
    data.tasks,
    data.quotes,
    data.sales,
    data.interactions,
    data.simulations,
    data.users,
    currentUser,
  ]);
}
