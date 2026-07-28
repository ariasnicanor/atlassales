import { useMemo } from "react";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { can } from "@/lib/permissions";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { parseISO } from "date-fns";

function isThisMonth(iso: string) {
  const d = parseISO(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function GoalsInner() {
  const { goals, sales, users } = useData();
  const { currentUser } = useSession();
  const seeTeam = can(currentUser, "view_team"); // supervisor / admin

  const teamGoal = goals.find((g) => g.user_id === null);
  const monthSales = sales.filter((s) => isThisMonth(s.created_at));
  const teamAchieved = monthSales.reduce((acc, s) => acc + s.amount, 0);
  const teamProgress = teamGoal ? Math.min(100, (teamAchieved / teamGoal.target_amount) * 100) : 0;

  const rows = useMemo(
    () =>
      goals
        .filter((g) => g.user_id && (seeTeam || g.user_id === currentUser?.id))
        .map((g) => {
          const user = users.find((u) => u.id === g.user_id);
          const achieved = monthSales.filter((s) => s.user_id === g.user_id).reduce((a, s) => a + s.amount, 0);
          const progress = Math.min(100, (achieved / g.target_amount) * 100);
          return { goal: g, user, achieved, progress };
        }),
    [goals, monthSales, users, seeTeam, currentUser]
  );

  return (
    <div className="space-y-6">
      {!seeTeam && rows.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Todavía no tenés un objetivo mensual asignado. Pedile a tu supervisor que cargue uno.
          </CardContent>
        </Card>
      )}

      {seeTeam && teamGoal && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5 text-primary" /> Objetivo del equipo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{formatCurrency(teamAchieved)}</p>
                <p className="text-sm text-muted-foreground">de {formatCurrency(teamGoal.target_amount)}</p>
              </div>
              <Badge variant={teamProgress >= 100 ? "success" : "secondary"} className="text-base">{formatPercent(teamProgress / 100)}</Badge>
            </div>
            <Progress value={teamProgress} indicatorClassName={teamProgress >= 100 ? "bg-success" : undefined} />
          </CardContent>
        </Card>
      )}

      <div className={seeTeam ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
        {rows.map(({ goal, user, achieved, progress }) => {
          const tone = progressTone(progress);
          const remaining = Math.max(0, goal.target_amount - achieved);
          return (
            <Card key={goal.id} className={tone.border}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user?.name ?? "?"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Objetivo mensual: {formatCurrency(goal.target_amount)} · {goal.target_units} u.
                        </p>
                      </div>
                    </div>

                    <Progress value={progress} indicatorClassName={tone.bar} />

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[11px] text-muted-foreground">Alcanzado</p>
                        <p className="truncate text-sm font-semibold">{formatCurrency(achieved)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[11px] text-muted-foreground">Objetivo</p>
                        <p className="truncate text-sm font-semibold">{formatCurrency(goal.target_amount)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[11px] text-muted-foreground">Falta</p>
                        <p className={`truncate text-sm font-semibold ${remaining === 0 ? "text-success" : ""}`}>
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-4xl font-bold leading-none tabular-nums sm:text-5xl ${tone.text}`}>
                      {Math.round(progress)}
                      <span className="text-xl sm:text-2xl">%</span>
                    </p>
                    <Badge variant={tone.badge} className="mt-2">{tone.label}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

export default function Goals() {
  return (
    <div className="space-y-6">
      <PageHeader title="Objetivos" description="Metas mensuales por vendedor y equipo, con avance en tiempo real." badge={<Badge variant="secondary">Growth</Badge>} />
      <UpgradeGate tier="growth" preview={<Card className="h-72" />}><GoalsInner /></UpgradeGate>
    </div>
  );
}
