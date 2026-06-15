import { Link } from "react-router-dom";
import { Lock, Sparkles, Check } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlan } from "@/hooks/usePlan";
import { PLAN_BY_TIER } from "@/lib/plans";
import type { PlanTier } from "@/types";

interface UpgradeGateProps {
  tier: PlanTier;
  children: ReactNode;
  /** Preview shown blurred behind the lock overlay. */
  preview?: ReactNode;
}

/**
 * Si el plan está activo, renderiza el contenido real.
 * Si no, muestra un overlay comercial de "Upgrade" con la preview detrás.
 */
export function UpgradeGate({ tier, children, preview }: UpgradeGateProps) {
  const { hasTier, activatePlan } = usePlan();
  const plan = PLAN_BY_TIER[tier];

  if (hasTier(tier)) return <>{children}</>;

  return (
    <div className="relative">
      {preview && (
        <div className="pointer-events-none select-none opacity-40 blur-[2px]" aria-hidden>
          {preview}
        </div>
      )}

      <div
        className={
          preview
            ? "absolute inset-0 flex items-center justify-center p-4"
            : "flex items-center justify-center p-4"
        }
      >
        <Card className="w-full max-w-lg border-primary/30 bg-card/95 p-6 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="size-5" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">
                <Sparkles className="size-3" /> {plan.name}
              </Badge>
              <h3 className="text-lg font-semibold leading-tight">
                Desbloqueá {plan.name}
              </h3>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{plan.tagline}</p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-success" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => activatePlan(tier)} className="flex-1">
              <Sparkles className="size-4" /> Activar en la demo
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/plans">Ver planes</Link>
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            En la demo podés activar el módulo sin costo para mostrar cómo funciona.
          </p>
        </Card>
      </div>
    </div>
  );
}
