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
import { Avatar } from "@/components/ui/avatar";
import { LeadStatusBadge, TemperatureBadge } from "@/components/commercial/StatusBadges";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useMetrics } from "@/hooks/useMetrics";
import { useSession } from "@/context/session";
import { formatPercent } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const m = useMetrics();
  const { currentUser } = useSession();

  const firstName = currentUser?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${firstName}`}
        description="Este es el resumen de tu actividad comercial de hoy."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/tasks")}>
              <CheckSquare className="size-4" /> Tareas
            </Button>
            <Button variant="outline" onClick={() => navigate("/stock")}>
              <Package className="size-4" /> Stock
            </Button>
            <Button onClick={() => navigate("/leads/new")}>
              <Plus className="size-4" /> Nuevo lead
            </Button>
          </>
        }
      />

      {/* Indicadores rápidos */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Leads nuevos" value={m.leadsNuevos} icon={Flame} tone="brand" onClick={() => navigate("/leads?status=nuevo")} />
        <StatCard label="En seguimiento" value={m.enSeguimiento} icon={Eye} onClick={() => navigate("/leads")} />
        <StatCard label="Leads calientes" value={m.calientes} icon={Thermometer} tone="destructive" onClick={() => navigate("/leads?temp=caliente")} />
        <StatCard label="Tareas vencidas" value={m.tareasVencidas} icon={AlertTriangle} tone="warning" onClick={() => navigate("/tasks")} />
        <StatCard label="Cotizaciones pendientes" value={m.cotizacionesPendientes} icon={FileText} onClick={() => navigate("/growth/quoter")} />
        <StatCard label="Ventas del mes" value={m.ventasCerradasMes} icon={Trophy} tone="success" />
        <StatCard label="Conversión" value={formatPercent(m.conversion)} icon={TrendingUp} tone="brand" hint="Ganados / cerrados" />
        <StatCard label="Total leads" value={m.totalLeads} icon={Eye} hint="En tu pipeline" />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Leads calientes */}
        <Card className="min-w-0 lg:col-span-2">

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
    </div>
  );
}
