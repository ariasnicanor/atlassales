import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Repeat2, Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/forms/Field";
import { EmptyState } from "@/components/commercial/EmptyState";
import { LeadStatusBadge, TemperatureBadge } from "@/components/commercial/StatusBadges";
import { useScopedData } from "@/hooks/useScopedData";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { can } from "@/lib/permissions";
import { fmtDate, fmtDateTime } from "@/lib/date";
import { INTERACTION_LABEL } from "@/lib/labels";
import type { Lead } from "@/types";

type FollowState = "todos" | "programado" | "vencido" | "sin_seguimiento";

export default function Remarketing() {
  const { leads } = useScopedData();
  const { users, interactions, updateLead } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();

  const canAssign = can(currentUser, "assign", "remarketing");

  const [search, setSearch] = useState("");
  const [seller, setSeller] = useState("todos");
  const [source, setSource] = useState("todos");
  const [follow, setFollow] = useState<FollowState>("todos");
  const [sinceFrom, setSinceFrom] = useState("");
  const [sinceTo, setSinceTo] = useState("");
  const [nextFrom, setNextFrom] = useState("");
  const [nextTo, setNextTo] = useState("");

  const sellers = users.filter((u) => u.role === "vendedor" && u.active);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const base = useMemo(() => leads.filter((l) => l.status === "remarketing"), [leads]);
  const sources = useMemo(
    () => Array.from(new Set(base.map((l) => l.source).filter(Boolean))).sort(),
    [base]
  );

  const lastInteraction = (leadId: string) =>
    interactions
      .filter((i) => i.lead_id === leadId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

  const inRange = (value: string | null | undefined, from: string, to: string) => {
    if (!from && !to) return true;
    if (!value) return false;
    const d = value.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return base.filter((l) => {
      if (seller === "sin_asignar" ? Boolean(l.assigned_user_id) : seller !== "todos" && l.assigned_user_id !== seller)
        return false;
      if (source !== "todos" && l.source !== source) return false;
      if (!inRange(l.remarketing_since, sinceFrom, sinceTo)) return false;
      if (!inRange(l.next_contact_at, nextFrom, nextTo)) return false;
      if (follow === "sin_seguimiento" && l.next_contact_at) return false;
      if (follow === "programado" && !(l.next_contact_at && l.next_contact_at.slice(0, 10) >= today)) return false;
      if (follow === "vencido" && !(l.next_contact_at && l.next_contact_at.slice(0, 10) < today)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.name} ${l.phone ?? ""} ${l.email ?? ""} ${l.product_interest ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [base, seller, source, follow, sinceFrom, sinceTo, nextFrom, nextTo, search, today]);

  const unassigned = filtered.filter((l) => !l.assigned_user_id).length;

  const assign = (lead: Lead, userId: string) => {
    if (!userId) return;
    updateLead(lead.id, { assigned_user_id: userId });
    toast(`${lead.name} asignado a ${userById.get(userId)?.name ?? "vendedor"}`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Remarketing"
        description="Contactos derivados al equipo de marketing/supervisión. Conservan su vendedor asignado; nunca se reasignan automáticamente."
        badge={<Badge variant="secondary">{base.length}</Badge>}
      />

      {unassigned > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3 text-sm">
            <span className="font-medium">{unassigned}</span> contacto(s) de Remarketing sin responsable —
            asignalos manualmente desde cada tarjeta.
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono, producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vendedor">
            <Select value={seller} onChange={(e) => setSeller(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="sin_asignar">Sin asignar</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Origen del lead">
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="todos">Todos</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Estado del seguimiento">
            <Select value={follow} onChange={(e) => setFollow(e.target.value as FollowState)}>
              <option value="todos">Todos</option>
              <option value="programado">Con seguimiento programado</option>
              <option value="vencido">Seguimiento vencido</option>
              <option value="sin_seguimiento">Sin seguimiento</option>
            </Select>
          </Field>
          <Field label="Ingreso a Remarketing — desde">
            <Input type="date" value={sinceFrom} onChange={(e) => setSinceFrom(e.target.value)} />
          </Field>
          <Field label="Ingreso a Remarketing — hasta">
            <Input type="date" value={sinceTo} onChange={(e) => setSinceTo(e.target.value)} />
          </Field>
          <Field label="Próximo seguimiento — desde">
            <Input type="date" value={nextFrom} onChange={(e) => setNextFrom(e.target.value)} />
          </Field>
          <Field label="Próximo seguimiento — hasta">
            <Input type="date" value={nextTo} onChange={(e) => setNextTo(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{filtered.length} contacto(s)</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Repeat2}
          title="Sin contactos en Remarketing"
          description="Los leads sin gestión por 30 días se derivan automáticamente acá."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lead) => {
            const owner = lead.assigned_user_id ? userById.get(lead.assigned_user_id) : null;
            const last = lastInteraction(lead.id);
            return (
              <Card key={lead.id}>
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/leads/${lead.id}`} className="min-w-0 font-semibold hover:underline">
                      {lead.name}
                    </Link>
                    <TemperatureBadge temperature={lead.temperature} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <LeadStatusBadge status={lead.status} />
                    <Badge variant="muted">{lead.source}</Badge>
                  </div>
                  <dl className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <dt>Responsable</dt>
                      <dd className={owner ? "font-medium text-foreground" : "font-medium text-destructive"}>
                        {owner?.name ?? "Sin asignar"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>En Remarketing desde</dt>
                      <dd>{lead.remarketing_since ? fmtDate(lead.remarketing_since) : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Próximo contacto</dt>
                      <dd>{lead.next_contact_at ? fmtDate(lead.next_contact_at) : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Última interacción</dt>
                      <dd className="truncate">
                        {last ? `${INTERACTION_LABEL[last.type]} · ${fmtDateTime(last.created_at)}` : "—"}
                      </dd>
                    </div>
                  </dl>
                  {canAssign && (
                    <div className="flex items-center gap-2 pt-1">
                      <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
                      <Select
                        value={lead.assigned_user_id ?? ""}
                        onChange={(e) => assign(lead, e.target.value)}
                        aria-label={`Asignar ${lead.name}`}
                      >
                        <option value="">Asignar a…</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to={`/leads/${lead.id}`}>Ver ficha</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
