import { useData } from "@/data/store";
import { MODULE_TIER, PLAN_BY_TIER } from "@/lib/plans";
import type { PlanTier } from "@/types";

/** Plan access helpers driven by company.active_plans. */
export function usePlan() {
  const { company, updateCompany } = useData();
  const active = company.active_plans;

  const hasTier = (tier: PlanTier) => active.includes(tier);

  const hasModule = (moduleKey: string) => {
    const tier = MODULE_TIER[moduleKey] ?? "core";
    return active.includes(tier);
  };

  /** Demo helper: simulate "buying" a plan to unlock its module. */
  const activatePlan = (tier: PlanTier) => {
    if (active.includes(tier)) return;
    updateCompany({ active_plans: [...active, tier] });
  };

  const deactivatePlan = (tier: PlanTier) => {
    if (tier === "core") return; // Core siempre activo
    updateCompany({ active_plans: active.filter((t) => t !== tier) });
  };

  return {
    activePlans: active,
    hasTier,
    hasModule,
    activatePlan,
    deactivatePlan,
    planFor: (moduleKey: string) => PLAN_BY_TIER[MODULE_TIER[moduleKey] ?? "core"],
  };
}
