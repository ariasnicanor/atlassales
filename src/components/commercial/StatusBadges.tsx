import { Badge } from "@/components/ui/badge";
import type {
  LeadStatus,
  ProductStatus,
  QuoteStatus,
  TaskStatus,
  Temperature,
} from "@/types";
import {
  LEAD_STATUS_LABEL,
  PRODUCT_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  TASK_STATUS_LABEL,
  TEMPERATURE_EMOJI,
  TEMPERATURE_LABEL,
} from "@/lib/labels";

type Variant = React.ComponentProps<typeof Badge>["variant"];

const leadVariant: Record<LeadStatus, Variant> = {
  nuevo: "default",
  contactado: "secondary",
  en_seguimiento: "secondary",
  cotizado: "warning",
  negociacion: "warning",
  ganado: "success",
  perdido: "destructive",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={leadVariant[status]}>{LEAD_STATUS_LABEL[status]}</Badge>;
}

const tempVariant: Record<Temperature, Variant> = {
  frio: "secondary",
  tibio: "warning",
  caliente: "destructive",
};

export function TemperatureBadge({ temperature }: { temperature: Temperature }) {
  return (
    <Badge variant={tempVariant[temperature]}>
      <span>{TEMPERATURE_EMOJI[temperature]}</span>
      {TEMPERATURE_LABEL[temperature]}
    </Badge>
  );
}

const productVariant: Record<ProductStatus, Variant> = {
  disponible: "success",
  reservado: "warning",
  vendido: "muted",
  sin_stock: "destructive",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge variant={productVariant[status]}>{PRODUCT_STATUS_LABEL[status]}</Badge>;
}

const taskVariant: Record<TaskStatus, Variant> = {
  pendiente: "secondary",
  en_proceso: "warning",
  completada: "success",
  vencida: "destructive",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={taskVariant[status]}>{TASK_STATUS_LABEL[status]}</Badge>;
}

const quoteVariant: Record<QuoteStatus, Variant> = {
  borrador: "muted",
  enviada: "secondary",
  aceptada: "success",
  rechazada: "destructive",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge variant={quoteVariant[status]}>{QUOTE_STATUS_LABEL[status]}</Badge>;
}
