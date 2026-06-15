import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, Trophy, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/commercial/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/data/store";
import { LEAD_STATUS_LABEL, LEAD_STATUS_ORDER } from "@/lib/labels";
import { formatCurrency, formatPercent } from "@/lib/utils";

const COLORS = ["#0EA5E9", "#7C3AED", "#10B981", "#F59E0B", "#F43F5E", "#6366F1", "#14B8A6"];

export default function Reports() {
  const { leads, users, tasks, sales } = useData();

  const sellers = users.filter((u) => u.role === "vendedor");

  const leadsByStatus = useMemo(
    () =>
      LEAD_STATUS_ORDER.map((s) => ({
        name: LEAD_STATUS_LABEL[s],
        value: leads.filter((l) => l.status === s).length,
      })),
    [leads]
  );

  const leadsBySeller = useMemo(
    () =>
      sellers.map((u) => ({
        name: u.name.split(" ")[0],
        leads: leads.filter((l) => l.assigned_user_id === u.id).length,
        ganados: leads.filter((l) => l.assigned_user_id === u.id && l.status === "ganado").length,
      })),
    [leads, sellers]
  );

  const activityBySeller = useMemo(
    () =>
      sellers.map((u) => ({
        name: u.name.split(" ")[0],
        tareas: tasks.filter((t) => t.assigned_user_id === u.id && t.status === "completada").length,
      })),
    [tasks, sellers]
  );

  const won = leads.filter((l) => l.status === "ganado").length;
  const lost = leads.filter((l) => l.status === "perdido").length;
  const wonLost = [
    { name: "Ganados", value: won },
    { name: "Perdidos", value: lost },
  ];
  const conversion = won + lost > 0 ? won / (won + lost) : 0;
  const totalSold = sales.reduce((acc, s) => acc + s.amount, 0);
  const completedTasks = tasks.filter((t) => t.status === "completada").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="La foto comercial de tu equipo, en un vistazo." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Conversión" value={formatPercent(conversion)} icon={TrendingUp} tone="brand" />
        <StatCard label="Ventas totales" value={formatCurrency(totalSold)} icon={Trophy} tone="success" />
        <StatCard label="Leads ganados" value={won} icon={Trophy} tone="success" />
        <StatCard label="Tareas completadas" value={completedTasks} icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads por estado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leadsByStatus} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]} fill="#0EA5E9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads por vendedor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leadsBySeller} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="leads" name="Trabajados" radius={[6, 6, 0, 0]} fill="#7C3AED" />
                <Bar dataKey="ganados" name="Ganados" radius={[6, 6, 0, 0]} fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ganados vs Perdidos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={wonLost} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  <Cell fill="#10B981" />
                  <Cell fill="#F43F5E" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actividad por vendedor (tareas completadas)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activityBySeller} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="tareas" name="Tareas" radius={[0, 6, 6, 0]}>
                  {activityBySeller.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
