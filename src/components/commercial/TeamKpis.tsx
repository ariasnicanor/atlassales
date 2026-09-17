import { Users, PhoneCall, BadgeCheck, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/commercial/StatCard";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useTeamKpis, formatContactTime } from "@/hooks/useTeamKpis";
import { formatPercent } from "@/lib/utils";

function Bar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-primary" : pct >= 25 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function TeamKpis() {
  const { enabled, sellers, totals } = useTeamKpis();
  if (!enabled || !totals) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Leads del equipo" value={totals.leads} icon={Users} tone="brand" />
        <StatCard
          label="Leads contactados"
          value={formatPercent(totals.contactRate)}
          icon={PhoneCall}
          hint="Con al menos un contacto"
        />
        <StatCard
          label="Ventas confirmadas"
          value={formatPercent(totals.confirmRate)}
          icon={BadgeCheck}
          tone="success"
          hint={`${totals.ventasConfirmadas} de ${totals.ventasSolicitadas} solicitudes`}
        />
        <StatCard
          label="Tiempo prom. de contacto"
          value={formatContactTime(totals.avgContactHours)}
          icon={Timer}
          tone="warning"
          hint="Desde que entra el lead"
        />
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" /> Rendimiento por vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin vendedores asignados"
              description="Cuando tengas vendedores a cargo vas a ver acá sus indicadores."
            />
          ) : (
            <div className="divide-y">
              {sellers.map((s) => (
                <div key={s.user.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={s.user.name} size="sm" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium">{s.user.name}</p>
                      <p className="shrink-0 text-sm text-muted-foreground">{s.leads} leads</p>
                    </div>
                    <Bar value={s.contactRate} />
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span>
                        Contactados{" "}
                        <strong className="text-foreground">{formatPercent(s.contactRate)}</strong>
                      </span>
                      <span>
                        Ventas conf.{" "}
                        <strong className="text-foreground">
                          {s.ventasConfirmadas}/{s.ventasSolicitadas}
                        </strong>
                      </span>
                      <span className="text-right">
                        Tiempo{" "}
                        <strong className="text-foreground">
                          {formatContactTime(s.avgContactHours)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
