import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Send,
  UserPlus,
  Phone,
  ExternalLink,
  StickyNote,
  Check,
  CheckCheck,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadStatusBadge } from "@/components/commercial/StatusBadges";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { LEAD_STATUS_LABEL } from "@/lib/labels";
import { OPEN_PIPELINE, CLOSED_STATUSES, daysWithoutManagement, stalenessInfo } from "@/lib/lead-management";
import { cn, initials } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";

/** Normaliza teléfonos a solo dígitos para matching. */
function normalizePhone(v: string | null | undefined) {
  return (v ?? "").replace(/\D/g, "");
}

interface ChatMsg {
  id: string;
  from: "them" | "me";
  text: string;
  at: string;
  /** Si fue registrado en el CRM como interacción. */
  logged?: boolean;
}

interface Conversation {
  phone: string;
  displayName: string;
  messages: ChatMsg[];
}

/** Genera conversaciones simuladas desde los leads con teléfono + un par de números desconocidos. */
function seedConversations(leads: Lead[]): Conversation[] {
  const base: Conversation[] = leads
    .filter((l) => l.phone)
    .slice(0, 10)
    .map((l, idx) => {
      const ago = (mins: number) =>
        new Date(Date.now() - mins * 60_000).toISOString();
      return {
        phone: normalizePhone(l.phone),
        displayName: l.name,
        messages: [
          {
            id: `m-${l.id}-1`,
            from: "them",
            text: `Hola, vi ${l.product_interest ?? "un producto"} en su web. ¿Sigue disponible?`,
            at: ago(120 + idx * 17),
          },
          {
            id: `m-${l.id}-2`,
            from: "me",
            text: "¡Hola! Sí, todavía tenemos disponibilidad. ¿Querés que te pase info?",
            at: ago(90 + idx * 17),
            logged: true,
          },
          {
            id: `m-${l.id}-3`,
            from: "them",
            text: "Dale, mandame precio final y opciones de financiación.",
            at: ago(20 + idx * 3),
          },
        ],
      };
    });

  // Dos conversaciones de números "desconocidos" (sin lead vinculado)
  base.unshift(
    {
      phone: "5491133449988",
      displayName: "+54 9 11 3344 9988",
      messages: [
        {
          id: "unk-1",
          from: "them",
          text: "Buenas, vi el aviso de MercadoLibre. Me pasan más fotos?",
          at: new Date(Date.now() - 10 * 60_000).toISOString(),
        },
      ],
    },
    {
      phone: "5491144556677",
      displayName: "+54 9 11 4455 6677",
      messages: [
        {
          id: "unk-2",
          from: "them",
          text: "Hola, un conocido me dio su contacto. Quería preguntarles algo.",
          at: new Date(Date.now() - 42 * 60_000).toISOString(),
        },
      ],
    }
  );

  return base;
}

const STORAGE_KEY = "atlas-sales-os:wa-chats:v1";

function loadChats(fallback: Conversation[]): Conversation[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Conversation[];
  } catch { /* ignore */ }
  return fallback;
}

export default function WhatsAppPage() {
  const { leads, createLead, updateLead, addInteraction } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();

  const seeded = useMemo(() => seedConversations(leads), []);
  const [conversations, setConversations] = useState<Conversation[]>(() => loadChats(seeded));
  const [activePhone, setActivePhone] = useState<string | null>(seeded[0]?.phone ?? null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistencia local del histórico simulado.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch { /* ignore */ }
  }, [conversations]);

  // Autoscroll al final cuando cambia la conversación o llegan mensajes.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activePhone, conversations]);

  // Index de leads por teléfono (real-time: se recalcula al mutar store).
  const leadByPhone = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of leads) {
      const p = normalizePhone(l.phone);
      if (p) m.set(p, l);
    }
    return m;
  }, [leads]);

  const activeConversation = conversations.find((c) => c.phone === activePhone) ?? null;
  const activeLead = activePhone ? leadByPhone.get(activePhone) ?? null : null;

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const lead = leadByPhone.get(c.phone);
    const name = (lead?.name ?? c.displayName).toLowerCase();
    const last = c.messages[c.messages.length - 1]?.text.toLowerCase() ?? "";
    return name.includes(q) || c.phone.includes(q) || last.includes(q);
  });

  const sendMessage = () => {
    if (!draft.trim() || !activeConversation) return;
    const now = new Date().toISOString();
    const text = draft.trim();
    const msg: ChatMsg = { id: `msg-${Date.now()}`, from: "me", text, at: now, logged: false };
    setConversations((cs) =>
      cs.map((c) => (c.phone === activeConversation.phone ? { ...c, messages: [...c.messages, msg] } : c))
    );
    setDraft("");

    // Si hay lead vinculado, registrar automáticamente como gestión (whatsapp)
    if (activeLead && currentUser) {
      addInteraction({
        lead_id: activeLead.id,
        user_id: currentUser.id,
        type: "whatsapp",
        note: text,
      });
      setConversations((cs) =>
        cs.map((c) =>
          c.phone === activeConversation.phone
            ? { ...c, messages: c.messages.map((m) => (m.id === msg.id ? { ...m, logged: true } : m)) }
            : c
        )
      );
    }
  };

  const changeStatus = (status: LeadStatus) => {
    if (!activeLead) return;
    updateLead(activeLead.id, { status });
    toast(`Estado actualizado: ${LEAD_STATUS_LABEL[status]}`);
  };

  const saveNote = () => {
    if (!activeLead || !note.trim() || !currentUser) return;
    addInteraction({
      lead_id: activeLead.id,
      user_id: currentUser.id,
      type: "nota",
      note: note.trim(),
    });
    setNote("");
    toast("Nota agregada y gestión registrada");
  };

  const logManagement = () => {
    if (!activeLead || !currentUser) return;
    addInteraction({
      lead_id: activeLead.id,
      user_id: currentUser.id,
      type: "whatsapp",
      note: "Gestión de WhatsApp registrada desde el chat",
    });
    toast("Gestión registrada");
  };

  const createFromChat = () => {
    if (!activePhone || !activeConversation) return;
    const lastText = activeConversation.messages[activeConversation.messages.length - 1]?.text ?? "";
    const lead = createLead({
      name: `Contacto WhatsApp ${activePhone.slice(-4)}`,
      phone: activePhone,
      source: "WhatsApp",
      status: "nuevo",
      temperature: "tibio",
      notes: lastText ? `Primer mensaje: ${lastText}` : null,
    });
    // Registrar los mensajes previos entrantes como historial
    if (currentUser) {
      for (const m of activeConversation.messages.filter((x) => x.from === "them")) {
        addInteraction({
          lead_id: lead.id,
          user_id: currentUser.id,
          type: "whatsapp",
          note: m.text,
        });
      }
    }
    toast("Lead creado desde WhatsApp");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp"
        description="Gestioná leads sin salir del chat. La conversación es simulada; la estructura queda lista para conectar la API oficial."
      />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Lista de conversaciones */}
        <Card className={cn("h-[70vh]", activeConversation && "hidden lg:block")}>
          <CardContent className="flex h-full flex-col gap-3 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar chat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
              {filtered.map((c) => {
                const lead = leadByPhone.get(c.phone);
                const last = c.messages[c.messages.length - 1];
                const label = lead?.name ?? c.displayName;
                return (
                  <button
                    key={c.phone}
                    onClick={() => setActivePhone(c.phone)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                      activePhone === c.phone
                        ? "bg-primary/10"
                        : "hover:bg-accent"
                    )}
                  >
                    <Avatar name={label} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{label}</p>
                        {!lead && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            Sin lead
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {last?.text ?? "Sin mensajes"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className={cn("h-[70vh]", !activeConversation && "hidden lg:block")}>
          <CardContent className="flex h-full flex-col p-0">
            {activeConversation ? (
              <>
                <div className="flex items-center gap-3 border-b p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setActivePhone(null)}
                    aria-label="Volver a chats"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Avatar name={activeLead?.name ?? activeConversation.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {activeLead?.name ?? activeConversation.displayName}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Phone className="size-3" /> {activeConversation.phone}
                    </p>
                  </div>
                  {activeLead && <LeadStatusBadge status={activeLead.status} />}
                </div>

                <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4 scrollbar-thin">
                  {activeConversation.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.from === "me" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                          m.from === "me"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <div
                          className={cn(
                            "mt-1 flex items-center justify-end gap-1 text-[10px]",
                            m.from === "me" ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}
                        >
                          {new Date(m.at).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.from === "me" &&
                            (m.logged ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t p-3">
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder={activeLead ? "Escribí un mensaje..." : "Sin lead vinculado — creá uno para registrar gestiones"}
                      className="min-h-[40px] resize-none"
                    />
                    <Button
                      onClick={sendMessage}
                      size="icon"
                      disabled={!draft.trim()}
                      aria-label="Enviar"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                  {!activeLead && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Enviar solo simula el mensaje. Creá el lead desde el panel para que cuente como gestión.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                <div className="space-y-2">
                  <MessageCircle className="mx-auto size-10 opacity-40" />
                  <p>Elegí una conversación para empezar.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel del lead */}
        <Card className={cn("h-[70vh]", !activeConversation && "hidden lg:block")}>
          <CardContent className="flex h-full flex-col gap-4 overflow-y-auto p-4 scrollbar-thin">
            {!activeConversation ? (
              <p className="text-sm text-muted-foreground">Sin conversación seleccionada.</p>
            ) : activeLead ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={activeLead.name}>
                    <span className="text-sm font-semibold">{initials(activeLead.name)}</span>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{activeLead.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {activeLead.source} · {activeLead.temperature}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="icon" aria-label="Abrir en CRM">
                    <Link to={`/leads/${activeLead.id}`}>
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                </div>

                {(() => {
                  const d = daysWithoutManagement(activeLead);
                  const s = stalenessInfo(d);
                  return (
                    <div className={cn("flex items-center gap-2 rounded-md border p-2 text-xs", s.className)}>
                      <span className={cn("size-2 rounded-full", s.dotClass)} />
                      {s.label}
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Estado</label>
                  <Select value={activeLead.status} onValueChange={(v) => changeStatus(v as LeadStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...OPEN_PIPELINE, "vendido", ...CLOSED_STATUSES.filter((s) => s !== "vendido")].map((s) => (
                        <SelectItem key={s} value={s}>
                          {LEAD_STATUS_LABEL[s as LeadStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeLead.product_interest && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Interés</p>
                    <p className="text-sm">{activeLead.product_interest}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <StickyNote className="size-3.5" /> Nueva nota
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Ej.: cliente pide llamada mañana 10hs"
                  />
                  <Button onClick={saveNote} disabled={!note.trim()} className="w-full" size="sm">
                    Guardar nota y registrar gestión
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={logManagement}>
                  Marcar como gestionado ahora
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <UserPlus className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Número sin lead vinculado</p>
                  <p className="text-xs text-muted-foreground">
                    {activeConversation.phone}
                  </p>
                </div>
                <Button className="w-full" onClick={createFromChat}>
                  <UserPlus className="size-4" /> Crear lead desde este chat
                </Button>
                <p className="text-xs text-muted-foreground">
                  Se cargará con origen "WhatsApp" y los mensajes previos quedarán como historial de gestión.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
