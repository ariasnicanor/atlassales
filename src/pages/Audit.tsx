import { useMemo, useState } from "react";
import { ShieldCheck, Download, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { can } from "@/lib/permissions";
import { Navigate } from "react-router-dom";
import { formatDate } from "@/lib/date";

export default function Audit() {
  const { auditLog } = useData();
  const { currentUser } = useSession();
  const allowed = can(currentUser, "view", "audit");

  const [query, setQuery] = useState("");
  const [resource, setResource] = useState<string>("all");
  const [action, setAction] = useState<string>("all");

  const resources = useMemo(
    () => Array.from(new Set(auditLog.map((e) => e.resource))).sort(),
    [auditLog]
  );
  const actions = useMemo(
    () => Array.from(new Set(auditLog.map((e) => e.action))).sort(),
    [auditLog]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditLog.filter((e) => {
      if (resource !== "all" && e.resource !== resource) return false;
      if (action !== "all" && e.action !== action) return false;
      if (!q) return true;
      return (
        e.user_name.toLowerCase().includes(q) ||
        (e.meta ?? "").toLowerCase().includes(q) ||
        (e.resource_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [auditLog, query, resource, action]);

  if (!allowed) return <Navigate to="/dashboard" replace />;

  function exportCsv() {
    const rows = [
      ["Fecha", "Usuario", "Acción", "Recurso", "ID", "Detalles"],
      ...filtered.map((e) => [
        e.created_at,
        e.user_name,
        e.action,
        e.resource,
        e.resource_id ?? "",
        e.meta ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Registro de acciones realizadas por los usuarios."
        badge={<Badge variant="success"><ShieldCheck className="size-3" /> Admin</Badge>}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="size-4" /> Exportar CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar usuario, ID o detalle…"
                className="pl-9"
              />
            </div>
            <Select value={resource} onChange={(e) => setResource(e.target.value)}>
              <option value="all">Todos los recursos</option>
              {resources.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
            <Select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="all">Todas las acciones</option>
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Usuario</th>
                  <th className="py-2 pr-3">Acción</th>
                  <th className="py-2 pr-3">Recurso</th>
                  <th className="py-2 pr-3">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Sin registros.
                    </td>
                  </tr>
                )}
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap py-2 pr-3 text-muted-foreground">
                      {formatDate(e.created_at, { withTime: true })}
                    </td>
                    <td className="py-2 pr-3 font-medium">{e.user_name}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="secondary">{e.action}</Badge>
                    </td>
                    <td className="py-2 pr-3">{e.resource}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {e.meta ?? e.resource_id ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
