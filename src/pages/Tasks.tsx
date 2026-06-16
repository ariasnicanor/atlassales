import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, CheckSquare, CheckCircle2, Circle, AlertTriangle, CalendarDays, Clock, LayoutList, Columns3, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/forms/Field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const { leads, toggleTaskComplete, createTask, updateTask, deleteTask, users } = useData();
  const { tasks, seeAll } = useScopedData();
  const { currentUser } = useSession();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("nueva") === "1");
  const [editing, setEditing] = useState<Task | null>(null);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v && params.get("nueva")) {
      const next = new URLSearchParams(params);
      next.delete("nueva");
      setParams(next, { replace: true });
    }
  };

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
    handleOpenChange(false);
  };

  const TaskItem = ({ t }: { t: Task }) => {
    const lead = leads.find((l) => l.id === t.lead_id);
    const done = t.status === "completada";
    const overdue = !done && isOverdue(t.due_date);
    return (
      <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
        <button onClick={() => toggleTaskComplete(t.id)} className="mt-0.5" aria-label="Completar tarea">
          {done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground hover:text-primary" />}
        </button>
        <button onClick={() => setEditing(t)} className="min-w-0 flex-1 text-left">
          <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>{t.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {fmtDate(t.due_date)}</span>
            {t.due_time && <span className="flex items-center gap-1"><Clock className="size-3.5" /> {t.due_time}</span>}
            {lead && <span className="text-primary">{lead.name}</span>}
          </div>
        </button>
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

  // Tarjeta compacta para kanban
  const KanbanCard = ({ t }: { t: Task }) => {
    const lead = leads.find((l) => l.id === t.lead_id);
    const done = t.status === "completada";
    return (
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-start gap-2">
          <button onClick={() => toggleTaskComplete(t.id)} className="mt-0.5" aria-label="Completar tarea">
            {done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground hover:text-primary" />}
          </button>
          <button onClick={() => setEditing(t)} className={cn("flex-1 text-left text-sm font-medium", done && "text-muted-foreground line-through")}>{t.title}</button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {fmtDate(t.due_date)}</span>
          <Badge variant={priorityVariant[t.priority]}>{TASK_PRIORITY_LABEL[t.priority]}</Badge>
        </div>
        {lead && <Link to={`/leads/${lead.id}`} className="mt-1 block truncate text-xs text-primary hover:underline">{lead.name}</Link>}
      </div>
    );
  };

  const KanbanCol = ({ title, items, tone }: { title: string; items: Task[]; tone: string }) => (
    <div className="w-72 shrink-0">
      <div className="mb-2 flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${tone}`} />
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="muted" className="ml-auto">{items.length}</Badge>
      </div>
      <div className="space-y-2 rounded-xl bg-muted/40 p-2">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">Sin tareas</p>
        ) : (
          items.map((t) => <KanbanCard key={t.id} t={t} />)
        )}
      </div>
    </div>
  );

  const sellers = users;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Tu agenda de seguimiento comercial. No se te escapa nada."
        actions={
          <Dialog open={open} onOpenChange={handleOpenChange}>
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
        <Tabs defaultValue="list">
          <div className="flex justify-end">
            <TabsList>
              <TabsTrigger value="list"><LayoutList className="size-4" /> <span className="ml-1.5 hidden sm:inline">Lista</span></TabsTrigger>
              <TabsTrigger value="kanban"><Columns3 className="size-4" /> <span className="ml-1.5 hidden sm:inline">Kanban</span></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list">
            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Vencidas" icon={AlertTriangle} items={groups.vencidas} tone="text-destructive" />
              <Section title="Para hoy" icon={Clock} items={groups.hoy} tone="text-warning" />
              <Section title="Próximas" icon={CalendarDays} items={groups.proximas} tone="text-primary" />
              <Section title="Completadas" icon={CheckCircle2} items={groups.completadas} tone="text-success" />
            </div>
          </TabsContent>

          <TabsContent value="kanban">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              <KanbanCol title="Vencidas" items={groups.vencidas} tone="bg-rose-500" />
              <KanbanCol title="Para hoy" items={groups.hoy} tone="bg-amber-500" />
              <KanbanCol title="Próximas" items={groups.proximas} tone="bg-sky-500" />
              <KanbanCol title="Completadas" items={groups.completadas} tone="bg-emerald-500" />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Editar / borrar tarea */}
      <Dialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          {editing && (
            <TaskEditForm
              key={editing.id}
              task={editing}
              leads={leads}
              users={users}
              seeAll={seeAll}
              onSave={(patch) => { updateTask(editing.id, patch); toast("Tarea actualizada"); setEditing(null); }}
              onDelete={() => { deleteTask(editing.id); toast("Tarea eliminada"); setEditing(null); }}
              onToggle={() => { toggleTaskComplete(editing.id); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskEditForm({
  task,
  leads,
  users,
  seeAll,
  onSave,
  onDelete,
  onToggle,
}: {
  task: Task;
  leads: { id: string; name: string }[];
  users: { id: string; name: string }[];
  seeAll: boolean;
  onSave: (patch: Partial<Task>) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(task.due_date.slice(0, 10));
  const [dueTime, setDueTime] = useState(task.due_time ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState(task.status);
  const [leadId, setLeadId] = useState(task.lead_id ?? "");
  const [assigned, setAssigned] = useState(task.assigned_user_id ?? "");

  const save = () =>
    onSave({
      title,
      description: description || null,
      due_date: new Date(dueDate).toISOString(),
      due_time: dueTime || null,
      priority,
      status,
      lead_id: leadId || null,
      assigned_user_id: assigned || null,
    });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Editar tarea</DialogTitle></DialogHeader>
      <Field label="Título"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Descripción"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
        <Field label="Hora"><Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prioridad">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="completada">Completada</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lead asociado">
          <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">Ninguno</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
        {seeAll && (
          <Field label="Asignar a">
            <Select value={assigned} onChange={(e) => setAssigned(e.target.value)}>
              <option value="">Sin asignar</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onToggle}>
          {task.status === "completada" ? "Marcar pendiente" : "Marcar completada"}
        </Button>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={onDelete}><Trash2 className="size-4" /> Borrar</Button>
          <Button onClick={save}>Guardar</Button>
        </div>
      </div>
    </div>
  );
}
