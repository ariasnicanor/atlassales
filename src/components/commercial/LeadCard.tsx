import { Link } from "react-router-dom";
import { Phone, MessageCircle, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge, TemperatureBadge } from "./StatusBadges";
import type { Lead, User } from "@/types";
import { whatsappLink, telLink } from "@/lib/contact";
import { fromNow, isOverdue } from "@/lib/date";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  seller?: User;
}

export function LeadCard({ lead, seller }: LeadCardProps) {
  const overdue = isOverdue(lead.next_contact_at);

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
          {seller && <span className="truncate">· {seller.name}</span>}
        </div>

        {lead.next_contact_at && (
          <div className={cn("flex items-center gap-1.5 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
            <Clock className="size-3.5" />
            Próximo contacto {fromNow(lead.next_contact_at)}
          </div>
        )}

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
