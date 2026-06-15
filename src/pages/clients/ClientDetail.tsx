import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, Mail, Contact, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/commercial/EmptyState";
import { LeadStatusBadge } from "@/components/commercial/StatusBadges";
import { useData } from "@/data/store";
import { whatsappLink, telLink, mailLink } from "@/lib/contact";
import { fmtDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";

export default function ClientDetail() {
  const { id } = useParams();
  const { clients, leads, sales, products } = useData();
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <EmptyState
        icon={Contact}
        title="Cliente no encontrado"
        action={<Button asChild><Link to="/clients">Volver</Link></Button>}
      />
    );
  }

  const clientLeads = leads.filter((l) => l.client_id === client.id);
  const clientSales = sales.filter((s) => s.client_id === client.id);
  const productName = (pid?: string | null) => products.find((p) => p.id === pid)?.name ?? "—";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/clients"><ArrowLeft className="size-4" /> Volver a clientes</Link>
      </Button>

      <PageHeader
        title={client.name}
        description={[client.company_name, client.city].filter(Boolean).join(" · ") || "Cliente"}
        actions={
          <>
            <Button asChild variant="outline"><a href={telLink(client.phone)}><Phone className="size-4" /> Llamar</a></Button>
            <Button asChild variant="success"><a href={whatsappLink(client.phone)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Información</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Teléfono" value={client.phone ?? "—"} />
            <Row label="Email" value={client.email ?? "—"} />
            <Row label="Empresa" value={client.company_name ?? "—"} />
            <Row label="Ciudad" value={client.city ?? "—"} />
            <Row label="Cliente desde" value={fmtDate(client.created_at)} />
            {client.notes && <div className="rounded-lg bg-muted/60 p-3 text-muted-foreground">{client.notes}</div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Leads asociados ({clientLeads.length})</CardTitle></CardHeader>
          <CardContent>
            {clientLeads.length === 0 ? (
              <EmptyState icon={Contact} title="Sin leads asociados" />
            ) : (
              <div className="divide-y">
                {clientLeads.map((l) => (
                  <Link key={l.id} to={`/leads/${l.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80">
                    <Avatar name={l.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.product_interest ?? "—"}</p>
                    </div>
                    <LeadStatusBadge status={l.status} />
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Historial comercial</CardTitle></CardHeader>
        <CardContent>
          {clientSales.length === 0 ? (
            <EmptyState icon={Contact} title="Sin operaciones registradas" description="Cuando este cliente concrete una compra, aparecerá acá." />
          ) : (
            <div className="divide-y">
              {clientSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{productName(s.product_id)}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(s.created_at)}</p>
                  </div>
                  <span className="font-semibold text-success">{formatCurrency(s.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}
