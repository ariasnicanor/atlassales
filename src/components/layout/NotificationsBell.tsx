import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Clock, CheckSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useScopedData } from "@/hooks/useScopedData";
import { isOverdue, isDueToday, fmtDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Campana del navbar: tareas vencidas y de hoy (solo título), siempre visible. */
export function NotificationsBell() {
  const navigate = useNavigate();
  const { tasks } = useScopedData();
  const [open, setOpen] = useState(false);

  const { overdue, today } = useMemo(() => {
    const pending = tasks.filter((t) => t.status !== "completada");
    return {
      overdue: pending.filter((t) => isOverdue(t.due_date)),
      today: pending.filter((t) => isDueToday(t.due_date)),
    };
  }, [tasks]);

  const count = overdue.length + today.length;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative inline-flex size-10 items-center justify-center rounded-lg hover:bg-accent" aria-label="Notificaciones">
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {count}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notificaciones</DialogTitle>
        </DialogHeader>

        {count === 0 ? (
          <EmptyState icon={CheckSquare} title="Todo al día" description="No tenés tareas vencidas ni para hoy." />
        ) : (
          <div className="space-y-4">
            {overdue.length > 0 && (
              <Section title="Vencidas" icon={AlertTriangle} tone="text-destructive" tasks={overdue} go={go} />
            )}
            {today.length > 0 && (
              <Section title="Para hoy" icon={Clock} tone="text-warning" tasks={today} go={go} />
            )}
            <button onClick={() => go("/tasks")} className="w-full rounded-lg border py-2 text-sm font-medium hover:bg-accent">
              Ver todas las tareas
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon: Icon,
  tone,
  tasks,
  go,
}: {
  title: string;
  icon: typeof Bell;
  tone: string;
  tasks: { id: string; title: string; due_date: string; lead_id?: string | null }[];
  go: (p: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("size-3.5", tone)} /> {title} ({tasks.length})
      </p>
      <div className="space-y-1.5">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.lead_id ? `/leads/${t.lead_id}` : "/tasks")}
            className="flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 text-left hover:bg-accent"
          >
            <span className="truncate text-sm font-medium">{t.title}</span>
            <Badge variant="muted" className="shrink-0">{fmtDate(t.due_date)}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
