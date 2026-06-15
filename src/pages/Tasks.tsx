import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, CheckSquare, CheckCircle2, Circle, AlertTriangle, CalendarDays, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/forms/Field";
import { EmptyState } from "@/components/commercial/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useData } from "@/data/store";
import { useScopedData } from "@/hooks/useScopedData";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { fmtDate, isOverdue, isDueToday } from "@/lib/date";
import { TASK_PRIORITY_LABEL } from "@/lib/labels";
import { taskSchema, type TaskFormValues } from "@/lib/validators";
import type { Task, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";

const priorityVariant: Record<TaskPriority, "muted" | "warning" | "destructive"> = {
  baja: "muted",
  media: "warning",
  alta: "destructive",
};

export default function Tasks() {
  const { leads, toggleTaskComplete, createTask } = useData();
  const { tasks, seeAll } = useScopedData();
  const { currentUser } = useSession();
  const { users } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "media",
      status: "pendiente",
      due_date: new Date().toISOString().slice(0, 10),
      assigned_user_id: currentUser?.id ?? "",
    },
  });

  const groups = useMemo(() => {
    const pending = tasks.filter((t) => t.status !== "completada");
    return {
      vencidas: pending.filter((t) => isOverdue(t.due_date)),
      hoy: pending.filter((t) => isDueToday(t.due_date)),
      proximas: pending.filter((t) => !isOverdue(t.due_date) && !isDueToday(t.due_date)),
      completadas: tasks.filter((t) => t.status === "completada"),
    };
  }, [tasks]);

  const onSubmit = (values: TaskFormValues) => {
    createTask({
      ...values,
      description: values.description || null,
      lead_id: values.lead_id || null,
      assigned_user_id: values.assigned_user_id || currentUser?.id || null,
      due_date: new Date(values.due_date).toISOString(),
      due_time: values.due_time || null,
    });
    toast("Tarea creada");
    reset();
    setOpen(false);
  };

  const sellers = users.filter((u) => u.role !== "admin" || true);

  const TaskItem = ({ t }: { t: Task }) => {
    const lead = leads.find((l) => l.id === t.lead_id);
    const done = t.status === "completada";
    const overdue = !done && isOverdue(t.due_date);
    return (
      <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
        <button onClick={() => toggleTaskComplete(t.id)} className="mt-0.5" aria-label="Completar tarea">
          {done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground hover:text-primary" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>{t.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {fmtDate(t.due_date)}</span>
            {t.due_time && <span className="flex items-center gap-1"><Clock className="size-3.5" /> {t.due_time}</span>}
            {lead && <Link to={`/leads/${lead.id}`} className="text-primary hover:underline">{lead.name}</Link>}
          </div>
        </div>
        <Badge variant={priorityVariant[t.priority]}>{TASK_PRIORITY_LABEL[t.priority]}</Badge>
        {overdue && <Badge variant="destructive">Vencida</Badge>}
      </div>
    );
  };

  const Section = ({ title, icon: Icon, items, tone }: { title: string; icon: typeof CheckSquare; items: Task[]; tone?: string }) => (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon className={cn("size-5", tone)} />
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="muted" className="ml-auto">{items.length}</Badge>
        </div>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nada por acá</p>
        ) : (
          <div className="divide-y">{items.map((t) => <TaskItem key={t.id} t={t} />)}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Tu agenda de seguimiento comercial. No se te escapa nada."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" /> Nueva tarea</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Título" required error={errors.title?.message}><Input placeholder="Ej: Llamar para coordinar visita" {...register("title")} /></Field>
                <Field label="Descripción"><Textarea {...register("description")} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fecha" required error={errors.due_date?.message}><Input type="date" {...register("due_date")} /></Field>
                  <Field label="Hora"><Input type="time" {...register("due_time")} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Prioridad">
                    <Select {...register("priority")}>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </Select>
                  </Field>
                  <Field label="Lead asociado">
                    <Select {...register("lead_id")}>
                      <option value="">Ninguno</option>
                      {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                  </Field>
                </div>
                {seeAll && (
                  <Field label="Asignar a">
                    <Select {...register("assigned_user_id")}>
                      {sellers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                  </Field>
                )}
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit">Crear tarea</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tenés tareas" description="Creá tu primera tarea de seguimiento." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Vencidas" icon={AlertTriangle} items={groups.vencidas} tone="text-destructive" />
          <Section title="Para hoy" icon={Clock} items={groups.hoy} tone="text-warning" />
          <Section title="Próximas" icon={CalendarDays} items={groups.proximas} tone="text-primary" />
          <Section title="Completadas" icon={CheckCircle2} items={groups.completadas} tone="text-success" />
        </div>
      )}
    </div>
  );
}
