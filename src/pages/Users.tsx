import { useMemo, useState } from "react";
import { ShieldCheck, Trophy, Flame, FileText, CheckCircle2, TrendingUp, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { can, roleLabel } from "@/lib/permissions";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { User, UserRole } from "@/types";

const roleVariant: Record<UserRole, "default" | "secondary" | "muted"> = {
  admin: "default",
  supervisor: "secondary",
  vendedor: "muted",
  recepcion: "muted",
};

export default function Users() {
  const { users, leads, quotes, tasks, sales, updateUser } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();
  const isAdmin = can(currentUser, "manage_users");
  const supervisors = useMemo(() => users.filter((u) => u.role === "supervisor" || u.role === "admin"), [users]);
  const [selected, setSelected] = useState<User | null>(null);

  const metricsFor = useMemo(
    () => (u: User) => {
      const uLeads = leads.filter((l) => l.assigned_user_id === u.id);
      const won = uLeads.filter((l) => l.status === "vendido").length;
      const lost = uLeads.filter((l) => l.status === "cerrado").length;
      const uSales = sales.filter((s) => s.user_id === u.id);
      return {
        leads: uLeads.length,
        won,
        quotes: quotes.filter((q) => q.user_id === u.id).length,
        tasksDone: tasks.filter((t) => t.assigned_user_id === u.id && t.status === "completada").length,
        sold: uSales.reduce((a, s) => a + s.amount, 0),
        conversion: won + lost > 0 ? won / (won + lost) : 0,
      };
    },
    [leads, quotes, tasks, sales]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Tu equipo comercial. Tocá un usuario para ver su rendimiento."
        badge={isAdmin ? <Badge variant="success"><ShieldCheck className="size-3" /> Admin</Badge> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const m = metricsFor(u);
          return (
            <Card key={u.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelected(u)}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} src={u.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant={u.active ? "success" : "muted"}>{u.active ? "Activo" : "Inactivo"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={roleVariant[u.role]}>{roleLabel(u.role)}</Badge>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Trophy className="size-3.5 text-success" /> {m.won}</span>
                    <span className="flex items-center gap-1"><Flame className="size-3.5 text-primary" /> {m.leads}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="size-3.5" /> {formatPercent(m.conversion)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalle / métricas / edición */}
      <Dialog open={Boolean(selected)} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          {selected && (
            <UserDetail
              key={selected.id}
              user={selected}
              metrics={metricsFor(selected)}
              isAdmin={isAdmin}
              supervisors={supervisors}
              onSave={(patch) => {
                updateUser(selected.id, patch);
                setSelected({ ...selected, ...patch });
                toast("Usuario actualizado");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserDetail({
  user,
  metrics,
  isAdmin,
  supervisors,
  onSave,
}: {
  user: User;
  metrics: { leads: number; won: number; quotes: number; tasksDone: number; sold: number; conversion: number };
  isAdmin: boolean;
  supervisors: User[];
  onSave: (patch: Partial<User>) => void;
}) {
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [active, setActive] = useState(user.active);
  const [supervisorId, setSupervisorId] = useState<string>(user.supervisor_id ?? "");

  const stats = [
    { icon: Trophy, label: "Ventas ganadas", value: String(metrics.won), tone: "text-success" },
    { icon: Flame, label: "Leads", value: String(metrics.leads), tone: "text-primary" },
    { icon: FileText, label: "Cotizaciones", value: String(metrics.quotes), tone: "" },
    { icon: CheckCircle2, label: "Tareas hechas", value: String(metrics.tasksDone), tone: "text-success" },
    { icon: TrendingUp, label: "Conversión", value: formatPercent(metrics.conversion), tone: "text-primary" },
    { icon: Trophy, label: "Vendido", value: formatCurrency(metrics.sold), tone: "" },
  ];

  return (
    <div className="space-y-5">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatar_url} size="lg" />
          <div>
            <DialogTitle>{user.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{roleLabel(role)}</p>
          </div>
        </div>
      </DialogHeader>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border p-3 text-center">
            <s.icon className={`mx-auto size-4 ${s.tone}`} />
            <p className="mt-1 text-sm font-semibold leading-tight">{s.value}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edición (solo admin) */}
      {isAdmin ? (
        <div className="space-y-3 border-t pt-4">
          <p className="flex items-center gap-1.5 text-sm font-medium"><Pencil className="size-3.5" /> Datos del CRM</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Teléfono"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Posición / Rol">
              <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="vendedor">Vendedor</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Field label="Estado">
              <div className="flex h-10 items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} aria-label="Activo" />
                <span className="text-sm text-muted-foreground">{active ? "Activo" : "Inactivo"}</span>
              </div>
            </Field>
          </div>
          {role === "vendedor" && (
            <Field label="Supervisor asignado">
              <Select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                <option value="">Sin supervisor</option>
                {supervisors.filter((s) => s.id !== user.id).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {roleLabel(s.role)}</option>
                ))}
              </Select>
            </Field>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
            <Button onClick={() => onSave({
              email,
              phone: phone || null,
              role,
              active,
              supervisor_id: role === "vendedor" ? (supervisorId || null) : null,
            })}>Guardar</Button>
          </DialogFooter>
        </div>
      ) : (
        <div className="space-y-1 border-t pt-4 text-sm">
          <Row label="Email" value={user.email} />
          <Row label="Teléfono" value={user.phone ?? "—"} />
          <p className="pt-2 text-xs text-muted-foreground">Solo un Admin puede editar los datos del usuario.</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
