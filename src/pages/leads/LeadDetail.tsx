import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  Pencil,
  FileText,
  Calculator,
  Send,
  Sparkles,
  CalendarClock,
  CalendarPlus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Field } from "@/components/forms/Field";
import { LeadStatusBadge, TemperatureBadge, QuoteStatusBadge } from "@/components/commercial/StatusBadges";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/components/ui/toast";
import { whatsappLink, telLink, mailLink } from "@/lib/contact";
import { formatCurrency } from "@/lib/utils";
import { fmtDate, fmtDateTime, fromNow } from "@/lib/date";
import { LEAD_STATUS_LABEL, LEAD_STATUS_ORDER, INTERACTION_LABEL } from "@/lib/labels";
import { daysWithoutManagement, stalenessInfo, isClosed } from "@/lib/lead-management";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import type { InteractionType, LeadStatus, Temperature, TaskPriority } from "@/types";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    leads,
    users,
    interactions,
    aiScores,
    quotes,
    simulations,
    products,
    updateLead,
    addInteraction,
    createTask,
    deleteLead,
    remarketingRequests,
    requestRemarketingLead,
  } = useData();
  const { currentUser } = useSession();
  const { hasModule } = usePlan();
  const { toast } = useToast();

  const lead = leads.find((l) => l.id === id);
  const [intType, setIntType] = useState<InteractionType>("llamada");
  const [intNote, setIntNote] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taskTime, setTaskTime] = useState("09:00");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("media");

  const canViewRemarketing = can(currentUser, "view", "remarketing");
  const canRequestRemarketing = can(currentUser, "request", "remarketing");
  const pendingRequest = remarketingRequests.find(
    (r) => r.lead_id === id && r.status === "pendiente" && r.requested_by === currentUser?.id
  );

  if (!lead) {
    return (
      <EmptyState
        icon={FileText}
        title="Lead no encontrado"
        description="Puede que haya sido eliminado."
        action={<Button asChild><Link to="/leads">Volver a leads</Link></Button>}
      />
    );
  }

  const seller = users.find((u) => u.id === lead.assigned_user_id);
  const leadInteractions = interactions
    .filter((i) => i.lead_id === lead.id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const score = aiScores.find((s) => s.lead_id === lead.id);
  const leadQuotes = quotes.filter((q) => q.lead_id === lead.id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const leadSims = simulations.filter((s) => s.lead_id === lead.id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const productName = (pid?: string | null) => products.find((p) => p.id === pid)?.name ?? "Producto";

  const changeStatus = (status: LeadStatus) => {
    updateLead(lead.id, { status });
    addInteraction({
      lead_id: lead.id,
      user_id: currentUser?.id ?? "user_v1",
      type: "cambio_estado",
      note: `Estado cambiado a "${LEAD_STATUS_LABEL[status]}"`,
    });
    toast("Estado actualizado");
  };

  const changeTemp = (temperature: Temperature) => {
    updateLead(lead.id, { temperature });
    toast("Temperatura actualizada");
  };

  const submitInteraction = () => {
    if (!intNote.trim()) {
      toast("Escribí una nota para registrar la interacción", "warning");
      return;
    }
    addInteraction({
      lead_id: lead.id,
      user_id: currentUser?.id ?? "user_v1",
      type: intType,
      note: intNote.trim(),
    });
    setIntNote("");
    toast("Interacción registrada");
  };

  const submitTask = () => {
    const title = taskTitle.trim() || `Contactar a ${lead.name}`;
    if (!taskDate) {
      toast("Elegí una fecha para la tarea", "warning");
      return;
    }
    createTask({
      lead_id: lead.id,
      assigned_user_id: lead.assigned_user_id ?? currentUser?.id ?? null,
      title,
      description: taskDesc.trim() || null,
      due_date: taskDate,
      due_time: taskTime || null,
      priority: taskPriority,
      status: "pendiente",
    });
    addInteraction({
      lead_id: lead.id,
      user_id: currentUser?.id ?? "user_v1",
      type: "nota",
      note: `Tarea creada: ${title} — ${taskDate}${taskTime ? ` ${taskTime}` : ""}`,
    });
    setTaskTitle("");
    setTaskDesc("");
    toast("Tarea creada y agendada en el calendario");
  };



  const handleDelete = () => {
    if (confirm(`¿Eliminar el lead "${lead.name}"?`)) {
      deleteLead(lead.id);
      toast("Lead eliminado");
      navigate("/leads");
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/leads"><ArrowLeft className="size-4" /> Volver a leads</Link>
      </Button>

      <PageHeader
        title={lead.name}
        description={`${lead.product_interest ?? "Sin producto"} · Origen: ${lead.source}`}
        badge={<TemperatureBadge temperature={lead.temperature} />}
        actions={
          <>
            <Button variant="outline" asChild><Link to={`/leads/${lead.id}/edit`}><Pencil className="size-4" /> Editar</Link></Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Eliminar"><Trash2 className="size-4" /></Button>
          </>
        }
      />

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button asChild variant="outline" className="h-14"><a href={telLink(lead.phone)}><Phone className="size-4" /> Llamar</a></Button>
        <Button asChild variant="success" className="h-14"><a href={whatsappLink(lead.phone, `Hola ${lead.name}!`)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
        <Button asChild variant="outline" className="h-14"><Link to={`/growth/quoter?lead=${lead.id}`}><FileText className="size-4" /> Cotizar</Link></Button>
        <Button asChild variant="outline" className="h-14"><Link to={`/growth/simulator?lead=${lead.id}`}><Calculator className="size-4" /> Simular</Link></Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Datos del lead</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Teléfono" value={lead.phone ?? "—"} />
              <Row label="Email" value={lead.email ?? "—"} />
              <Row label="Origen" value={lead.source} />
              <Row label="Vendedor" value={seller?.name ?? "Sin asignar"} />
              <Row label="Creado" value={fmtDate(lead.created_at)} />
              <Row label="Última gestión" value={fromNow(lead.last_management_at ?? lead.updated_at)} />
              {(lead.utm_source || lead.utm_campaign || lead.gclid || lead.fbclid) && (
                <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-xs">
                  <p className="mb-1 font-medium text-foreground">Atribución de campaña</p>
                  {lead.utm_source && <Row label="utm_source" value={lead.utm_source} />}
                  {lead.utm_medium && <Row label="utm_medium" value={lead.utm_medium} />}
                  {lead.utm_campaign && <Row label="utm_campaign" value={lead.utm_campaign} />}
                  {lead.utm_content && <Row label="utm_content" value={lead.utm_content} />}
                  {lead.utm_term && <Row label="utm_term" value={lead.utm_term} />}
                  {lead.gclid && <Row label="gclid" value={lead.gclid} />}
                  {lead.fbclid && <Row label="fbclid" value={lead.fbclid} />}
                </div>
              )}
              {(() => {
                const days = daysWithoutManagement(lead);
                const stale = stalenessInfo(days);
                return (
                  <div className={cn("flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs font-medium", stale.className)}>
                    <span className={cn("size-2 rounded-full", stale.dotClass)} aria-hidden />
                    {stale.label}
                  </div>
                );
              })()}
              {lead.status === "remarketing" && (
                <div className="space-y-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/5 p-3 text-xs">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="size-2 rounded-full bg-fuchsia-500" aria-hidden /> Estado: Remarketing
                  </p>
                  <Row label="Vendedor responsable" value={seller?.name ?? "Sin asignar"} />
                  <Row label="Pasó a Remarketing" value={lead.remarketing_since ? fmtDateTime(lead.remarketing_since) : "—"} />
                  {lead.remarketing_reason && <Row label="Motivo" value={lead.remarketing_reason} />}
                  <Row label="Próximo contacto" value={lead.next_contact_at ? fmtDate(lead.next_contact_at) : "Sin programar"} />
                  <Row
                    label="Última interacción"
                    value={
                      leadInteractions[0]
                        ? `${INTERACTION_LABEL[leadInteractions[0].type]} · ${fmtDateTime(leadInteractions[0].created_at)}`
                        : "Sin interacciones"
                    }
                  />
                  {!seller && (
                    <p className="pt-1 text-muted-foreground">
                      Sin responsable: visible para administración y recepción para asignación manual.
                    </p>
                  )}
                  {canViewRemarketing ? (
                    <Button asChild size="sm" variant="outline" className="mt-1">
                      <Link to="/remarketing">Ver bandeja de Remarketing</Link>
                    </Button>
                  ) : canRequestRemarketing ? (
                    pendingRequest ? (
                      <p className="mt-1 rounded-md bg-muted/60 px-2 py-1.5 text-muted-foreground">
                        Solicitud enviada el {fmtDateTime(pendingRequest.created_at)} — pendiente de
                        aprobación por supervisión.
                      </p>
                    ) : (
                      <div className="mt-1 space-y-2">
                        <Textarea
                          rows={2}
                          placeholder="Motivo de la solicitud (opcional)"
                          value={requestNote}
                          onChange={(e) => setRequestNote(e.target.value)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            requestRemarketingLead(lead.id, requestNote.trim() || null);
                            setRequestNote("");
                            toast("Solicitud enviada a supervisión");
                          }}
                        >
                          Solicitar recuperar este lead
                        </Button>
                      </div>
                    )
                  ) : null}
                </div>
              )}
              {lead.status !== "remarketing" && !isClosed(lead) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => changeStatus("remarketing")}
                >
                  Enviar a Remarketing
                </Button>
              )}
              {isClosed(lead) && (
                <div className="space-y-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs">
                  <p className="font-medium text-foreground">Lead cerrado — acciones de remarketing</p>
                  <p className="text-muted-foreground">Reactivalo a una etapa anterior o marcalo para campaña.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => changeStatus("contactado")}>Reactivar a Contactado</Button>
                    <Button size="sm" variant="outline" onClick={() => changeStatus("en_negociacion")}>Volver a Negociación</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        changeStatus("remarketing");
                        addInteraction({
                          lead_id: lead.id,
                          user_id: currentUser?.id ?? "user_v1",
                          type: "nota",
                          note: "Incluido en campaña de remarketing.",
                        });
                      }}
                    >
                      Enviar a remarketing
                    </Button>
                  </div>
                </div>
              )}
              {lead.notes && (
                <div className="rounded-lg bg-muted/60 p-3 text-muted-foreground">{lead.notes}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Gestión rápida</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Estado">
                <Select value={lead.status} onChange={(e) => changeStatus(e.target.value as LeadStatus)}>
                  {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                </Select>
              </Field>
              <Field label="Temperatura">
                <Select value={lead.temperature} onChange={(e) => changeTemp(e.target.value as Temperature)}>
                  <option value="frio">🧊 Frío</option>
                  <option value="tibio">🌤️ Tibio</option>
                  <option value="caliente">🔥 Caliente</option>
                </Select>
              </Field>
              <Field label="Próximo contacto" hint="Programá tu seguimiento">
                <input
                  type="date"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={lead.next_contact_at ? lead.next_contact_at.slice(0, 10) : ""}
                  onChange={(e) => {
                    updateLead(lead.id, {
                      next_contact_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    });
                    toast("Seguimiento programado");
                  }}
                />
              </Field>
              {lead.next_contact_at && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" /> {fmtDate(lead.next_contact_at)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Assist score */}
          {hasModule("ai-assist") && score ? (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" /> Score IA: {score.score}/100
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-primary">{score.recommended_action}</p>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {score.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex items-center gap-3 p-4">
                <Sparkles className="size-5 text-primary" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Score IA del lead</p>
                  <p className="text-xs text-muted-foreground">Disponible con AI Assist</p>
                </div>
                <Button size="sm" variant="outline" asChild><Link to="/ai-assist">Ver</Link></Button>
              </CardContent>
            </Card>
          )}

          {/* Cotizaciones y simulaciones del lead */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Cotizaciones y simulaciones</CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/growth/quoter?lead=${lead.id}`}><FileText className="size-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {leadQuotes.length === 0 && leadSims.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin cotizaciones ni simulaciones todavía. Generá una con los botones de arriba.
                </p>
              ) : (
                <>
                  {leadQuotes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                          <FileText className="size-3.5 text-primary" /> {productName(q.product_id)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(q.final_price)} · {fmtDate(q.created_at)}</p>
                      </div>
                      <QuoteStatusBadge status={q.status} />
                    </div>
                  ))}
                  {leadSims.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                          <Calculator className="size-3.5 text-primary" /> {productName(s.product_id)}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.term_months} cuotas · {fmtDate(s.created_at)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">{formatCurrency(s.estimated_payment)}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: interacciones */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Nueva tarea</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Título">
                  <input
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    placeholder={`Llamar a ${lead.name}`}
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </Field>
                <Field label="Prioridad">
                  <Select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </Select>
                </Field>
                <Field label="Fecha">
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                  />
                </Field>
                <Field label="Hora">
                  <input
                    type="time"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                  />
                </Field>
              </div>
              <Textarea
                rows={2}
                placeholder="Detalle de la tarea (opcional)"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={submitTask}><CalendarPlus className="size-4" /> Crear tarea</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                La tarea se suma al historial de interacciones y aparece en el calendario con el nombre del lead.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Registrar interacción</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <Select value={intType} onChange={(e) => setIntType(e.target.value as InteractionType)}>
                  <option value="llamada">📞 Llamada</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="email">✉️ Email</option>
                  <option value="reunion">🤝 Reunión</option>
                  <option value="nota">📝 Nota</option>
                </Select>
                <Textarea
                  placeholder="¿Qué pasó en este contacto?"
                  value={intNote}
                  onChange={(e) => setIntNote(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={submitInteraction}><Send className="size-4" /> Registrar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Historial de interacciones</CardTitle></CardHeader>
            <CardContent>
              {leadInteractions.length === 0 ? (
                <EmptyState icon={MessageCircle} title="Sin interacciones aún" description="Registrá tu primer contacto con este lead." />
              ) : (
                <div className="space-y-4">
                  {leadInteractions.map((i) => {
                    const user = users.find((u) => u.id === i.user_id);
                    return (
                      <div key={i.id} className="flex gap-3">
                        <Avatar name={user?.name ?? "?"} size="sm" />
                        <div className="flex-1 border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{INTERACTION_LABEL[i.type]}</Badge>
                            <span className="text-xs text-muted-foreground">{fmtDateTime(i.created_at)}</span>
                          </div>
                          <p className="mt-1.5 text-sm">{i.note}</p>
                          <p className="text-xs text-muted-foreground">{user?.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
