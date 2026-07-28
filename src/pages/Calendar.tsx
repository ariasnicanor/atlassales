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
import { ChevronLeft, ChevronRight, Flame, CheckSquare, CalendarClock, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  title: string;
  kind: "task" | "followup" | "interaction" | "google";
  href?: string;
  meta?: string;
  ownerName?: string;
  color: string;
}

const KIND_COLOR: Record<CalEvent["kind"], string> = {
  task: "bg-blue-500",
  followup: "bg-amber-500",
  interaction: "bg-emerald-500",
  google: "bg-purple-500",
};

const KIND_LABEL: Record<CalEvent["kind"], string> = {
  task: "Tarea",
  followup: "Seguimiento",
  interaction: "Gestión",
  google: "Google Calendar",
};

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const { users, leads } = useData();
  const { tasks, interactions } = useScopedData();
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
      list.push({
        id: `task-${t.id}`,
        date: d,
        time: t.due_time ?? undefined,
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
        title: i.note.length > 60 ? `${i.note.slice(0, 60)}…` : i.note,
        kind: "interaction",
        href: `/leads/${i.lead_id}`,
        meta: lead?.name,
        ownerName: userById.get(i.user_id)?.name,
        color: KIND_COLOR.interaction,
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
  }, [tasks, interactions, leadById, userById, visibleUserIds]);

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

          {view === "day" && <DayView date={cursor} events={events} />}
          {view === "week" && <WeekView anchor={cursor} events={events} />}
          {view === "month" && <MonthView anchor={cursor} events={events} onPickDay={(d) => { setCursor(d); setView("day"); }} />}
        </CardContent>
      </Card>
    </div>
  );
}

function EventPill({ ev, compact }: { ev: CalEvent; compact?: boolean }) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs truncate text-white",
        ev.color,
      )}
      title={`${ev.title}${ev.meta ? ` · ${ev.meta}` : ""}`}
    >
      {ev.time && <span className="font-mono text-[10px] opacity-90">{ev.time}</span>}
      <span className="truncate">{ev.title}</span>
    </div>
  );
  if (ev.href) {
    return (
      <Link to={ev.href} className={cn("block", compact ? "" : "hover:opacity-90")}>{inner}</Link>
    );
  }
  return inner;
}

function DayView({ date, events }: { date: Date; events: CalEvent[] }) {
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
        <EventRow key={ev.id} ev={ev} />
      ))}
    </div>
  );
}

function EventRow({ ev }: { ev: CalEvent }) {
  const icon =
    ev.kind === "task" ? CheckSquare :
    ev.kind === "followup" ? Flame :
    ev.kind === "interaction" ? Link2 :
    CalendarClock;
  const Icon = icon;
  const content = (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50">
      <span className={cn("mt-1 h-2.5 w-2.5 rounded-full shrink-0", ev.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{ev.title}</span>
          <Badge variant="outline" className="ml-auto shrink-0">{KIND_LABEL[ev.kind]}</Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground flex flex-wrap gap-x-2">
          <span className="font-mono">{ev.time ?? "—"}</span>
          {ev.meta && <span>· {ev.meta}</span>}
          {ev.ownerName && <span>· {ev.ownerName}</span>}
        </div>
      </div>
    </div>
  );
  return ev.href ? <Link to={ev.href}>{content}</Link> : content;
}

function WeekView({ anchor, events }: { anchor: Date; events: CalEvent[] }) {
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
                <EventPill key={ev.id} ev={ev} />
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
                  <div key={ev.id} className={cn("h-1.5 rounded-full", ev.color)} title={ev.title} />
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
