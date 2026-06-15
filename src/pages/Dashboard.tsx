import { Link, useNavigate } from "react-router-dom";
import {
  Flame,
  Eye,
  Thermometer,
  AlertTriangle,
  FileText,
  Trophy,
  Plus,
  CheckSquare,
  Package,
  ArrowRight,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/commercial/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LeadStatusBadge, TemperatureBadge } from "@/components/commercial/StatusBadges";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useMetrics } from "@/hooks/useMetrics";
import { useScopedData } from "@/hooks/useScopedData";
import { useSession } from "@/context/session";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { fmtDate, isOverdue, isDueToday } from "@/lib/date";

export default function Dashboard() {
  const navigate = useNavigate();
  const m = useMetrics();
  const { currentUser } = useSession();
  const { tasks } = useScopedData();

  const todayTasks = tasks
    .filter((t) => t.status !== "completada" && (isDueToday(t.due_date) || isOverdue(t.due_date)))
    .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
    .slice(0, 6);

  const firstName = currentUser?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${firstName} 👋`}
        description="Este es el resumen de tu actividad comercial de hoy."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/tasks")}>
              <CheckSquare className="size-4" /> Tareas
            </Button>
            <Button onClick={() => navigate("/leads/new")}>
              <Plus className="size-4" /> Nuevo lead
            </Button>
          </>
        }
      />

      {/* Indicadores rápidos */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads nuevos" value={m.leadsNuevos} icon={Flame} tone="brand" onClick={() => navigate("/leads?status=nuevo")} />
        <StatCard label="En seguimiento" value={m.enSeguimiento} icon={Eye} onClick={() => navigate("/leads")} />
        <StatCard label="Leads calientes" value={m.calientes} icon={Thermometer} tone="destructive" onClick={() => navigate("/leads?temp=caliente")} />
        <StatCard label="Tareas vencidas" value={m.tareasVencidas} icon={AlertTriangle} tone="warning" onClick={() => navigate("/tasks")} />
        <StatCard label="Cotizaciones pendientes" value={m.cotizacionesPendientes} icon={FileText} onClick={() => navigate("/growth/quoter")} />
        <StatCard label="Ventas del mes" value={m.ventasCerradasMes} icon={Trophy} tone="success" hint={formatCurrency(m.montoVendidoMes)} />
        <StatCard label="Conversión" value={formatPercent(m.conversion)} icon={TrendingUp} tone="brand" hint="Ganados / cerrados" />
        <StatCard label="Total leads" value={m.totalLeads} icon={Eye} hint="En tu pipeline" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leads calientes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="size-5 text-destructive" /> Leads calientes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads?temp=caliente">
                Ver todos <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {m.hotLeads.length === 0 ? (
              <EmptyState icon={Thermometer} title="No hay leads calientes ahora" description="Cuando un lead se marque como caliente, aparecerá acá para que actúes rápido." />
            ) : (
              <div className="divide-y">
                {m.hotLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    to={`/leads/${lead.id}`}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <Avatar name={lead.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{lead.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {lead.product_interest ?? "Sin producto"} · {lead.source}
                      </p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Necesitan seguimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" /> Necesitan seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {m.needsAttention.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Todo al día" description="No tenés seguimientos pendientes." />
            ) : (
              <div className="space-y-3">
                {m.needsAttention.map(({ lead, reason }) => (
                  <Link
                    key={lead.id}
                    to={`/leads/${lead.id}`}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="mt-0.5">
                      <TemperatureBadge temperature={lead.temperature} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{lead.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{reason}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tareas de hoy */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="size-5 text-primary" /> Tareas de hoy y vencidas
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                Ver todas <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Sin tareas urgentes" description="No tenés tareas para hoy ni vencidas. ¡Buen trabajo!" />
            ) : (
              <div className="divide-y">
                {todayTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`size-2 shrink-0 rounded-full ${isOverdue(t.due_date) ? "bg-destructive" : "bg-warning"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(t.due_date)} {t.due_time ?? ""}</p>
                    </div>
                    {isOverdue(t.due_date) ? (
                      <Badge variant="destructive">Vencida</Badge>
                    ) : (
                      <Badge variant="warning">Hoy</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-1.5" onClick={() => navigate("/leads/new")}>
              <Plus className="size-5" /> Crear lead
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-1.5" onClick={() => navigate("/tasks")}>
              <CheckSquare className="size-5" /> Crear tarea
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-1.5" onClick={() => navigate("/stock")}>
              <Package className="size-5" /> Ver stock
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-1.5" onClick={() => navigate("/growth/quoter")}>
              <FileText className="size-5" /> Cotizar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
