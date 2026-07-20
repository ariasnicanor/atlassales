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

    return {
      leads: data.leads.filter((l) => l.assigned_user_id && allowedIds.has(l.assigned_user_id)),
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
