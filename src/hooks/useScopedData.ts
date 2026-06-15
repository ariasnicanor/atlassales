import { useMemo } from "react";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { can } from "@/lib/permissions";

/**
 * Devuelve los datos filtrados según el rol del usuario actual:
 * - Admin / Supervisor: ven todo el equipo.
 * - Vendedor: ve solo lo propio.
 */
export function useScopedData() {
  const data = useData();
  const { currentUser } = useSession();

  return useMemo(() => {
    const seeAll = can(currentUser, "view_all_leads");
    const uid = currentUser?.id;

    if (seeAll) {
      return {
        leads: data.leads,
        tasks: data.tasks,
        quotes: data.quotes,
        sales: data.sales,
        seeAll,
      };
    }

    return {
      leads: data.leads.filter((l) => l.assigned_user_id === uid),
      tasks: data.tasks.filter((t) => t.assigned_user_id === uid),
      quotes: data.quotes.filter((q) => q.user_id === uid),
      sales: data.sales.filter((s) => s.user_id === uid),
      seeAll,
    };
  }, [data.leads, data.tasks, data.quotes, data.sales, currentUser]);
}
