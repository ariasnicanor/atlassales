import { useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search, LayoutGrid, Columns3, Flame } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeadCard } from "@/components/commercial/LeadCard";
import { TemperatureBadge } from "@/components/commercial/StatusBadges";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useScopedData } from "@/hooks/useScopedData";
import { useData } from "@/data/store";
import { LEAD_STATUS_LABEL, LEAD_STATUS_ORDER, LEAD_STATUS_ACCENT } from "@/lib/labels";
import type { LeadStatus, Temperature } from "@/types";

export default function Leads() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { leads, seeAll } = useScopedData();
  const { users } = useData();

  const [search, setSearch] = useState("");
  const statusFilter = params.get("status") ?? "todos";
  const tempFilter = params.get("temp") ?? "todos";
  const sellerFilter = params.get("seller") ?? "todos";

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "todos") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

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
          <Button onClick={() => navigate("/leads/new")}>
            <Plus className="size-4" /> Nuevo lead
          </Button>
        }
      />

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="todos">Todos los estados</option>
          {LEAD_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
          ))}
        </Select>
        <Select value={tempFilter} onChange={(e) => setFilter("temp", e.target.value)}>
          <option value="todos">Toda temperatura</option>
          <option value="caliente">🔥 Caliente</option>
          <option value="tibio">🌤️ Tibio</option>
          <option value="frio">🧊 Frío</option>
        </Select>
        {seeAll ? (
          <Select value={sellerFilter} onChange={(e) => setFilter("seller", e.target.value)}>
            <option value="todos">Todos los vendedores</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        ) : (
          <div className="hidden lg:block" />
        )}
      </div>

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
