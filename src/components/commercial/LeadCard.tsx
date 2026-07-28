import { Link } from "react-router-dom";
import { Phone, MessageCircle, ChevronRight, Clock, UserRound, FileText, Calculator, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LeadStatusBadge, TemperatureBadge } from "./StatusBadges";
import type { Lead, User } from "@/types";
import { whatsappLink, telLink } from "@/lib/contact";
import { fromNow, isOverdue } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { can } from "@/lib/permissions";
import { useToast } from "@/components/ui/toast";
import { daysWithoutManagement, stalenessInfo, isClosed } from "@/lib/lead-management";

interface LeadCardProps {
  lead: Lead;
  seller?: User;
}

export function LeadCard({ lead, seller }: LeadCardProps) {
  const overdue = isOverdue(lead.next_contact_at);
  const { users, updateLead, quotes, simulations } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();
  const canReassign = can(currentUser, "assign_leads");
  const sellers = users.filter((u) => u.role === "vendedor" || u.role === "supervisor");
  const quoteCount = quotes.filter((q) => q.lead_id === lead.id).length;
  const simCount = simulations.filter((s) => s.lead_id === lead.id).length;
  const staleDays = daysWithoutManagement(lead);
  const stale = stalenessInfo(staleDays);
  const closed = isClosed(lead);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar name={lead.name} />
          <Link to={`/leads/${lead.id}`} className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight">{lead.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {lead.product_interest ?? "Sin producto definido"}
            </p>
          </Link>
          <TemperatureBadge temperature={lead.temperature} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <LeadStatusBadge status={lead.status} />
          <span>· {lead.source}</span>
        </div>

        {/* Vendedor asignado (reasignable por supervisor/admin) */}
        {canReassign ? (
          <div className="flex items-center gap-2">
            <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
            <Select
              value={lead.assigned_user_id ?? ""}
              onChange={(e) => {
                updateLead(lead.id, { assigned_user_id: e.target.value || null });
                toast("Vendedor reasignado");
              }}
              className="h-8 text-xs"
              aria-label="Reasignar vendedor"
            >
              <option value="">Sin asignar</option>
              {sellers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </div>
        ) : (
          seller && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="size-3.5" /> {seller.name}
            </p>
          )
        )}

        {lead.next_contact_at && (
          <div className={cn("flex items-center gap-1.5 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
            <Clock className="size-3.5" />
            Próximo contacto {fromNow(lead.next_contact_at)}
          </div>
        )}

        {/* Días sin gestión — indicador de color */}
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", stale.className)}>
          <span className={cn("size-2 rounded-full", stale.dotClass)} aria-hidden />
          <Activity className="size-3.5" />
          {stale.label}
        </div>

        {closed && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-2 text-xs text-muted-foreground">
            Lead cerrado — disponible para remarketing.{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                updateLead(lead.id, { status: "contactado" });
                toast("Lead reactivado como Contactado");
              }}
            >
              Reactivar
            </button>
          </div>
        )}

        {/* Registro rápido: cotizaciones y simulaciones del lead */}
        <Link to={`/leads/${lead.id}`} className="flex items-center gap-3 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <FileText className="size-3.5" /> {quoteCount} {quoteCount === 1 ? "cotización" : "cotiz."}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calculator className="size-3.5" /> {simCount} {simCount === 1 ? "simulación" : "sim."}
          </span>
        </Link>

        <div className="flex items-center gap-2 pt-1">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <a href={telLink(lead.phone)} aria-label="Llamar">
              <Phone className="size-4" /> Llamar
            </a>
          </Button>
          <Button asChild size="sm" variant="success" className="flex-1">
            <a href={whatsappLink(lead.phone, `Hola ${lead.name}!`)} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="ghost" aria-label="Ver detalle">
            <Link to={`/leads/${lead.id}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
