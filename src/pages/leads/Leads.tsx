import { useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search, LayoutGrid, Columns3, Flame, SlidersHorizontal, X, Upload } from "lucide-react";
import { useSession } from "@/context/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Field } from "@/components/forms/Field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { LeadCard } from "@/components/commercial/LeadCard";
import { TemperatureBadge } from "@/components/commercial/StatusBadges";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useScopedData } from "@/hooks/useScopedData";
import { useData } from "@/data/store";
import { LEAD_STATUS_LABEL, LEAD_STATUS_ORDER, LEAD_STATUS_ACCENT, TEMPERATURE_LABEL } from "@/lib/labels";
import type { LeadStatus } from "@/types";

export default function Leads() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { leads, seeAll } = useScopedData();
  const { users } = useData();
  const { currentUser } = useSession();
  const canImport = currentUser?.role === "admin" || currentUser?.role === "supervisor";

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const statusFilter = params.get("status") ?? "todos";
  const tempFilter = params.get("temp") ?? "todos";
  const sellerFilter = params.get("seller") ?? "todos";

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "todos") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const clearFilters = () => setParams(new URLSearchParams(), { replace: true });

  const activeCount =
    (statusFilter !== "todos" ? 1 : 0) +
    (tempFilter !== "todos" ? 1 : 0) +
    (sellerFilter !== "todos" ? 1 : 0);

  const sellers = users.filter((u) => u.role === "vendedor");
  const sellerById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users]
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "todos" && l.status !== statusFilter) return false;
      if (tempFilter !== "todos" && l.temperature !== tempFilter) return false;
      if (sellerFilter !== "todos" && l.assigned_user_id !== sellerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.name} ${l.phone ?? ""} ${l.email ?? ""} ${l.product_interest ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, tempFilter, sellerFilter, search]);

  const byStatus = (status: LeadStatus) => filtered.filter((l) => l.status === status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Tu pipeline comercial. Filtrá, seguí y no pierdas oportunidades."
        actions={
          <div className="flex items-center gap-2">
            {canImport && (
              <Button variant="outline" asChild size="sm">
                <Link to="/leads/import" aria-label="Importar leads">
                  <Upload className="size-4" />
                  <span className="hidden sm:inline">Importar</span>
                </Link>
              </Button>
            )}
            <Button onClick={() => navigate("/leads/new")} size="icon" aria-label="Nuevo lead">
              <Plus className="size-4" />
            </Button>
          </div>
        }
      />

      {/* Búsqueda + botón de filtros (popup) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono, producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeCount > 0 && <Badge variant="default" className="ml-1">{activeCount}</Badge>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Filtros</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Field label="Estado">
                <Select value={statusFilter} onChange={(e) => setFilter("status", e.target.value)}>
                  <option value="todos">Todos los estados</option>
                  {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                </Select>
              </Field>
              <Field label="Temperatura">
                <Select value={tempFilter} onChange={(e) => setFilter("temp", e.target.value)}>
                  <option value="todos">Toda temperatura</option>
                  <option value="caliente">🔥 Caliente</option>
                  <option value="tibio">🌤️ Tibio</option>
                  <option value="frio">🧊 Frío</option>
                </Select>
              </Field>
              {seeAll && (
                <Field label="Vendedor">
                  <Select value={sellerFilter} onChange={(e) => setFilter("seller", e.target.value)}>
                    <option value="todos">Todos los vendedores</option>
                    {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={clearFilters}>Limpiar</Button>
              <DialogClose asChild><Button>Ver {filtered.length} resultados</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chips de filtros activos */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {statusFilter !== "todos" && (
            <Chip label={LEAD_STATUS_LABEL[statusFilter as LeadStatus]} onClear={() => setFilter("status", "todos")} />
          )}
          {tempFilter !== "todos" && (
            <Chip label={TEMPERATURE_LABEL[tempFilter as keyof typeof TEMPERATURE_LABEL] ?? tempFilter} onClear={() => setFilter("temp", "todos")} />
          )}
          {sellerFilter !== "todos" && (
            <Chip label={sellerById[sellerFilter]?.name ?? "Vendedor"} onClear={() => setFilter("seller", "todos")} />
          )}
          <button onClick={clearFilters} className="text-xs text-muted-foreground underline">Limpiar todo</button>
        </div>
      )}

      <Tabs defaultValue="list">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
          </p>
          <TabsList>
            <TabsTrigger value="list"><LayoutGrid className="size-4" /> <span className="ml-1.5 hidden sm:inline">Lista</span></TabsTrigger>
            <TabsTrigger value="pipeline"><Columns3 className="size-4" /> <span className="ml-1.5 hidden sm:inline">Pipeline</span></TabsTrigger>
          </TabsList>
        </div>

        {/* Lista */}
        <TabsContent value="list">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No hay leads con estos filtros"
              description="Probá cambiar los filtros o creá un nuevo lead."
              action={<Button onClick={() => navigate("/leads/new")}><Plus className="size-4" /> Nuevo lead</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((lead) => (
                <LeadCard key={lead.id} lead={lead} seller={sellerById[lead.assigned_user_id ?? ""]} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pipeline */}
        <TabsContent value="pipeline">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {LEAD_STATUS_ORDER.map((status) => {
              const items = byStatus(status);
              return (
                <div key={status} className="w-72 shrink-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${LEAD_STATUS_ACCENT[status]}`} />
                    <p className="text-sm font-medium">{LEAD_STATUS_LABEL[status]}</p>
                    <Badge variant="muted" className="ml-auto">{items.length}</Badge>
                  </div>
                  <div className="space-y-2 rounded-xl bg-muted/40 p-2">
                    {items.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">Sin leads</p>
                    ) : (
                      items.map((lead) => (
                        <Link
                          key={lead.id}
                          to={`/leads/${lead.id}`}
                          className="block rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">{lead.name}</p>
                            <TemperatureBadge temperature={lead.temperature} />
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {lead.product_interest ?? "Sin producto"}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button onClick={onClear} className="rounded-full p-0.5 hover:bg-background/50" aria-label="Quitar filtro">
        <X className="size-3" />
      </button>
    </Badge>
  );
}
