import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Flame, CheckSquare, CalendarClock, Link2, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LEAD_STATUS_LABEL, TASK_STATUS_LABEL } from "@/lib/labels";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useData } from "@/data/store";
import { useScopedData } from "@/hooks/useScopedData";
import { useSession } from "@/context/session";
import { pullEventsFromGoogle, getConnection, type SyncableEvent } from "@/lib/google-calendar";
import { teamMemberIds, dataScope } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

interface CalEvent {
  id: string;
  date: Date;
  time?: string;
  /** Nombre y apellido del lead/contacto — dato principal del evento. */
  leadName?: string;
  /** Título original de la actividad (usado como fallback). */
  title: string;
  kind: "task" | "followup" | "interaction" | "nextcontact" | "google";
  href?: string;
  /** Nota, mensaje o descripción — información secundaria. */
  note?: string;
  ownerName?: string;
  meta?: string;
  color: string;
  leadId?: string | null;
  leadPhone?: string | null;
  leadProduct?: string | null;
  statusLabel?: string;
}

/** Etiqueta principal del evento: nombre del lead si existe. */
function primaryLabel(ev: CalEvent) {
  return ev.leadName ?? ev.title;
}

const KIND_COLOR: Record<CalEvent["kind"], string> = {
  task: "bg-blue-500",
  followup: "bg-amber-500",
  interaction: "bg-emerald-500",
  nextcontact: "bg-rose-500",
  google: "bg-purple-500",
};

const KIND_LABEL: Record<CalEvent["kind"], string> = {
  task: "Tarea",
  followup: "Seguimiento",
  interaction: "Gestión",
  nextcontact: "Próximo contacto",
  google: "Google Calendar",
};

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const { users, leads } = useData();
  const { tasks, interactions, leads: scopedLeads } = useScopedData();
  const { currentUser } = useSession();

  const visibleUserIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    const scope = dataScope(currentUser);
    if (scope === "all") return new Set(users.map((u) => u.id));
    if (scope === "team") return new Set(teamMemberIds(currentUser, users));
    return new Set([currentUser.id]);
  }, [currentUser, users]);

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const events = useMemo<CalEvent[]>(() => {
    const list: CalEvent[] = [];
    // Tareas y seguimientos (tarea vinculada a lead = seguimiento)
    for (const t of tasks) {
      const iso = t.due_time ? `${t.due_date}T${t.due_time}` : `${t.due_date}T09:00`;
      const d = parseISO(iso);
      if (isNaN(d.getTime())) continue;
      const kind: CalEvent["kind"] = t.lead_id ? "followup" : "task";
      const tLead = t.lead_id ? leadById.get(t.lead_id) : undefined;
      list.push({
        id: `task-${t.id}`,
        date: d,
        time: t.due_time ?? undefined,
        leadName: tLead?.name,
        leadId: t.lead_id ?? null,
        leadPhone: tLead?.phone ?? null,
        leadProduct: tLead?.product_interest ?? null,
        statusLabel: TASK_STATUS_LABEL[t.status],
        note: t.description ?? t.title,
        title: t.title,
        kind,
        href: t.lead_id ? `/leads/${t.lead_id}` : `/tasks`,
        meta: t.lead_id ? leadById.get(t.lead_id)?.name : undefined,
        ownerName: t.assigned_user_id ? userById.get(t.assigned_user_id)?.name : undefined,
        color: KIND_COLOR[kind],
      });
    }
    // Gestiones (interacciones sobre leads)
    for (const i of interactions) {
      const d = parseISO(i.created_at);
      if (isNaN(d.getTime())) continue;
      const lead = leadById.get(i.lead_id);
      list.push({
        id: `int-${i.id}`,
        date: d,
        time: format(d, "HH:mm"),
        leadName: lead?.name,
        leadId: i.lead_id,
        leadPhone: lead?.phone ?? null,
        leadProduct: lead?.product_interest ?? null,
        statusLabel: lead ? LEAD_STATUS_LABEL[lead.status] : undefined,
        note: i.note,
        title: i.note.length > 60 ? `${i.note.slice(0, 60)}…` : i.note,
        kind: "interaction",
        href: `/leads/${i.lead_id}`,
        meta: lead?.name,
        ownerName: userById.get(i.user_id)?.name,
        color: KIND_COLOR.interaction,
      });
    }
    // Gestión rápida: próximos contactos programados en la ficha del lead
    for (const l of scopedLeads) {
      if (!l.next_contact_at) continue;
      const d = parseISO(l.next_contact_at);
      if (isNaN(d.getTime())) continue;
      list.push({
        id: `next-${l.id}`,
        date: d,
        time: undefined,
        leadName: l.name,
        leadId: l.id,
        leadPhone: l.phone ?? null,
        leadProduct: l.product_interest ?? null,
        statusLabel: LEAD_STATUS_LABEL[l.status],
        note: l.notes ?? "Próximo contacto programado desde Gestión rápida",
        title: `Próximo contacto · ${l.name}`,
        kind: "nextcontact",
        href: `/leads/${l.id}`,
        meta: l.product_interest ?? undefined,
        ownerName: l.assigned_user_id ? userById.get(l.assigned_user_id)?.name : undefined,
        color: KIND_COLOR.nextcontact,
      });
    }
    // Google Calendar (para cada usuario visible conectado)
    if (typeof window !== "undefined") {
      const seen = new Set<string>();
      for (const uid of visibleUserIds) {
        if (getConnection(uid).status !== "connected") continue;
        const gEvents: SyncableEvent[] = pullEventsFromGoogle(uid);
        for (const ev of gEvents) {
          const gKey = ev.google_event_id ?? ev.id;
          // Evitar duplicar los CRM que ya empujamos a Google
          if (ev.source !== "google" && (seen.has(ev.id) || list.some((l) => l.id === `task-${ev.id}`)))
            continue;
          seen.add(ev.id);
          const d = parseISO(ev.start);
          if (isNaN(d.getTime())) continue;
          list.push({
            id: `gcal-${uid}-${gKey}`,
            date: d,
            time: format(d, "HH:mm"),
            leadName: ev.lead_id ? leadById.get(ev.lead_id)?.name : undefined,
            leadId: ev.lead_id ?? null,
            leadPhone: ev.lead_id ? leadById.get(ev.lead_id)?.phone ?? null : null,
            leadProduct: ev.lead_id ? leadById.get(ev.lead_id)?.product_interest ?? null : null,
            note: ev.description ?? undefined,
            title: ev.title,
            kind: "google",
            href: ev.lead_id ? `/leads/${ev.lead_id}` : undefined,
            meta: ev.description ?? undefined,
            ownerName: userById.get(uid)?.name,
            color: KIND_COLOR.google,
          });
        }
      }
    }
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks, interactions, scopedLeads, leadById, userById, visibleUserIds]);

  const rangeLabel = useMemo(() => {
    if (view === "day") return format(cursor, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (view === "week") {
      const s = startOfWeek(cursor, { weekStartsOn: 1 });
      const e = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(s, "d MMM", { locale: es })} – ${format(e, "d MMM yyyy", { locale: es })}`;
    }
    return format(cursor, "MMMM yyyy", { locale: es });
  }, [view, cursor]);

  const shift = (dir: 1 | -1) => {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addWeeks(c, dir));
    else setCursor((c) => addMonths(c, dir));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendario"
        description="Gestiones, tareas y seguimientos de leads"
      />

      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => shift(-1)} aria-label="Anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCursor(startOfDay(new Date()))}>
                Hoy
              </Button>
              <Button size="sm" variant="outline" onClick={() => shift(1)} aria-label="Siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 font-medium capitalize">{rangeLabel}</span>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="day">Día</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {(Object.keys(KIND_COLOR) as CalEvent["kind"][]).map((k) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", KIND_COLOR[k])} />
                <span className="text-muted-foreground">{KIND_LABEL[k]}</span>
              </div>
            ))}
          </div>

          {view === "day" && <DayView date={cursor} events={events} onSelect={setSelected} />}
          {view === "week" && <WeekView anchor={cursor} events={events} onSelect={setSelected} />}
          {view === "month" && <MonthView anchor={cursor} events={events} onPickDay={(d) => { setCursor(d); setView("day"); }} />}
        </CardContent>
      </Card>

      <EventDetailDialog ev={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function EventDetailDialog({ ev, onClose }: { ev: CalEvent | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(ev)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {ev && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{primaryLabel(ev)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <DetailRow label="Actividad" value={KIND_LABEL[ev.kind]} />
              <DetailRow label="Fecha" value={format(ev.date, "EEEE d 'de' MMMM yyyy", { locale: es })} />
              <DetailRow label="Hora" value={ev.time ?? "—"} />
              <DetailRow label="Responsable" value={ev.ownerName ?? "Sin asignar"} />
              <DetailRow label="Teléfono" value={ev.leadPhone ?? "—"} />
              <DetailRow label="Producto de interés" value={ev.leadProduct ?? "—"} />
              <DetailRow label="Estado" value={ev.statusLabel ?? "—"} />
              {(ev.note || ev.title) && (
                <div className="rounded-lg bg-muted/60 p-3 text-muted-foreground">
                  {ev.note ?? ev.title}
                </div>
              )}
              {ev.leadId && (
                <Button asChild className="w-full">
                  <Link to={`/leads/${ev.leadId}`} onClick={onClose}>Ver ficha del contacto</Link>
                </Button>
              )}
              {!ev.leadId && ev.href && (
                <Button asChild variant="outline" className="w-full">
                  <Link to={ev.href} onClick={onClose}>Abrir</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function EventPill({ ev, onSelect }: { ev: CalEvent; onSelect: (ev: CalEvent) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ev)}
      className={cn(
        "block w-full rounded px-1.5 py-1 text-left text-xs text-white hover:opacity-90",
        ev.color,
      )}
      title={`${primaryLabel(ev)} · ${KIND_LABEL[ev.kind]}`}
    >
      <span className="block truncate font-semibold">{primaryLabel(ev)}</span>
      <span className="block truncate text-[10px] opacity-90">
        {KIND_LABEL[ev.kind]}{ev.time ? ` · ${ev.time}` : ""}
      </span>
    </button>
  );
}

function DayView({ date, events, onSelect }: { date: Date; events: CalEvent[]; onSelect: (ev: CalEvent) => void }) {
  const dayEvents = events.filter((e) => isSameDay(e.date, date));
  if (dayEvents.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Sin eventos"
        description="No hay gestiones ni tareas programadas para este día."
      />
    );
  }
  return (
    <div className="divide-y rounded-md border">
      {dayEvents.map((ev) => (
        <EventRow key={ev.id} ev={ev} onSelect={onSelect} />
      ))}
    </div>
  );
}

function EventRow({ ev, onSelect }: { ev: CalEvent; onSelect: (ev: CalEvent) => void }) {
  const Icon =
    ev.kind === "task" ? CheckSquare :
    ev.kind === "followup" ? Flame :
    ev.kind === "interaction" ? Link2 :
    CalendarClock;
  return (
    <button
      type="button"
      onClick={() => onSelect(ev)}
      className="flex w-full items-start gap-3 p-3 text-left hover:bg-muted/50"
    >
      <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", ev.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-semibold">{primaryLabel(ev)}</span>
          <Badge variant="outline" className="ml-auto shrink-0">{KIND_LABEL[ev.kind]}</Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{KIND_LABEL[ev.kind]}</span>
          <span className="font-mono">{ev.time ?? "—"}</span>
          {ev.ownerName && <span>· Responsable: {ev.ownerName}</span>}
        </div>
        {(ev.note || ev.title) && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">“{ev.note ?? ev.title}”</p>
        )}
      </div>
    </button>
  );
}

function WeekView({ anchor, events, onSelect }: { anchor: Date; events: CalEvent[]; onSelect: (ev: CalEvent) => void }) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end: endOfWeek(anchor, { weekStartsOn: 1 }) });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map((d) => {
        const list = events.filter((e) => isSameDay(e.date, d));
        const today = isSameDay(d, new Date());
        return (
          <div key={d.toISOString()} className={cn("rounded-md border p-2 min-h-[120px]", today && "border-primary bg-primary/5")}>
            <div className="text-xs font-semibold mb-1 capitalize">
              {format(d, "EEE d", { locale: es })}
            </div>
            <div className="space-y-1">
              {list.slice(0, 6).map((ev) => (
                <EventPill key={ev.id} ev={ev} onSelect={onSelect} />
              ))}
              {list.length > 6 && (
                <div className="text-[11px] text-muted-foreground">+{list.length - 6} más</div>
              )}
              {list.length === 0 && <div className="text-[11px] text-muted-foreground">Sin eventos</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ anchor, events, onPickDay }: { anchor: Date; events: CalEvent[]; onPickDay: (d: Date) => void }) {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekdayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] text-muted-foreground text-center">
        {weekdayLabels.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const list = events.filter((e) => isSameDay(e.date, d));
          const inMonth = isSameMonth(d, anchor);
          const today = isSameDay(d, new Date());
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPickDay(d)}
              className={cn(
                "text-left rounded border p-1.5 min-h-[80px] hover:border-primary transition-colors",
                !inMonth && "opacity-40",
                today && "border-primary bg-primary/5",
              )}
            >
              <div className="text-xs font-semibold mb-1">{format(d, "d")}</div>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((ev) => (
                  <div key={ev.id} className={cn("truncate rounded px-1 text-[9px] font-medium text-white", ev.color)} title={primaryLabel(ev)}>{primaryLabel(ev)}</div>
                ))}
                {list.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{list.length - 3}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
