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
  Wifi,
  WifiOff,
  QrCode,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { LeadStatusBadge } from "@/components/commercial/StatusBadges";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { LEAD_STATUS_LABEL } from "@/lib/labels";
import {
  OPEN_PIPELINE,
  CLOSED_STATUSES,
  daysWithoutManagement,
  stalenessInfo,
} from "@/lib/lead-management";
import { cn, initials } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";
import {
  useWhatsApp,
  normalizePhone,
  type WaChat,
  type WaMessage,
  type WaProviderStatus,
  type WaSeed,
} from "@/lib/whatsapp";

/** Genera las semillas del proveedor MOCK desde los leads con teléfono + números desconocidos. */
function buildSeed(leads: Lead[]): WaSeed {
  const chats: WaChat[] = [];
  const messages: Record<string, WaMessage[]> = {};
  const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

  leads
    .filter((l) => l.phone)
    .slice(0, 10)
    .forEach((l, idx) => {
      const phone = normalizePhone(l.phone);
      if (!phone || messages[phone]) return;
      const ms: WaMessage[] = [
        {
          id: `m-${l.id}-1`,
          chatId: phone,
          from: "them",
          text: `Hola, vi ${l.product_interest ?? "un producto"} en su web. ¿Sigue disponible?`,
          at: ago(120 + idx * 17),
        },
        {
          id: `m-${l.id}-2`,
          chatId: phone,
          from: "me",
          text: "¡Hola! Sí, todavía tenemos disponibilidad. ¿Querés que te pase info?",
          at: ago(90 + idx * 17),
          status: "read",
        },
        {
          id: `m-${l.id}-3`,
          chatId: phone,
          from: "them",
          text: "Dale, mandame precio final y opciones de financiación.",
          at: ago(20 + idx * 3),
        },
      ];
      messages[phone] = ms;
      chats.push({
        id: phone,
        phone,
        name: l.name,
        lastMessage: ms[ms.length - 1].text,
        lastAt: ms[ms.length - 1].at,
      });
    });

  // Dos conversaciones de números "desconocidos" (sin lead vinculado).
  const unknowns: Array<{ phone: string; name: string; text: string; mins: number }> = [
    {
      phone: "5491133449988",
      name: "+54 9 11 3344 9988",
      text: "Buenas, vi el aviso de MercadoLibre. Me pasan más fotos?",
      mins: 10,
    },
    {
      phone: "5491144556677",
      name: "+54 9 11 4455 6677",
      text: "Hola, un conocido me dio su contacto. Quería preguntarles algo.",
      mins: 42,
    },
  ];
  for (const u of unknowns) {
    const at = ago(u.mins);
    messages[u.phone] = [{ id: `unk-${u.phone}`, chatId: u.phone, from: "them", text: u.text, at }];
    chats.unshift({ id: u.phone, phone: u.phone, name: u.name, lastMessage: u.text, lastAt: at });
  }

  return { chats, messages };
}

/** Agrega o actualiza un chat cuando entra/sale un mensaje. */
function touchChats(chats: WaChat[], m: WaMessage, fallbackName?: string): WaChat[] {
  const idx = chats.findIndex((c) => c.id === m.chatId);
  if (idx >= 0) {
    const next = [...chats];
    next[idx] = { ...next[idx], lastMessage: m.text, lastAt: m.at };
    return next;
  }
  return [
    {
      id: m.chatId,
      phone: m.chatId,
      name: fallbackName ?? m.chatId,
      lastMessage: m.text,
      lastAt: m.at,
    },
    ...chats,
  ];
}

/** Banner de estado de conexión del proveedor (incluye QR para OpenWA). */
function ConnectionBanner({ status }: { status: WaProviderStatus | null }) {
  if (!status) return null;
  if (status.provider === "mock") return null; // el demo no necesita banner ruidoso

  const tone =
    status.state === "connected"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status.state === "qr"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : status.state === "connecting"
          ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
          : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";

  const Icon =
    status.state === "connected"
      ? Wifi
      : status.state === "qr"
        ? QrCode
        : status.state === "connecting"
          ? Loader2
          : WifiOff;

  const qrSrc = status.qr
    ? status.qr.startsWith("data:")
      ? status.qr
      : `data:image/png;base64,${status.qr}`
    : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center",
        tone,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", status.state === "connecting" && "animate-spin")} />
        <span className="font-medium">{status.label}</span>
      </div>
      {status.state === "qr" && qrSrc && (
        <div className="flex items-center gap-3 sm:ml-auto">
          <img
            src={qrSrc}
            alt="QR para vincular WhatsApp"
            className="size-28 rounded bg-white p-1"
          />
          <p className="text-xs opacity-80">
            Abrí WhatsApp en tu teléfono → Dispositivos vinculados → Vincular dispositivo.
          </p>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppPage() {
  const { leads, createLead, updateLead, addInteraction } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();

  // Semilla del mock a partir de los leads (se calcula una sola vez al montar:
  // el proveedor mock consume la semilla una única vez y luego persiste su estado).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seed = useMemo(() => buildSeed(leads), []);
  const { provider, status, providerId } = useWhatsApp({ seed });

  const [chats, setChats] = useState<WaChat[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, WaMessage[]>>({});
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Index de leads por teléfono (real-time: se recalcula al mutar store).
  const leadByPhone = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of leads) {
      const p = normalizePhone(l.phone);
      if (p) m.set(p, l);
    }
    return m;
  }, [leads]);

  // Cargar lista de chats cuando el proveedor está listo / cambia su estado.
  useEffect(() => {
    if (!provider) return;
    let alive = true;
    void provider.listChats().then((cs) => {
      if (!alive) return;
      setChats(cs);
      setActivePhone((p) => p ?? cs[0]?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, [provider, status?.state]);

  // Cargar mensajes del chat activo.
  useEffect(() => {
    if (!provider || !activePhone) return;
    let alive = true;
    void provider.getMessages(activePhone).then((ms) => {
      if (alive) setMessagesByChat((prev) => ({ ...prev, [activePhone]: ms }));
    });
    return () => {
      alive = false;
    };
  }, [provider, activePhone]);

  // Suscripción a mensajes entrantes (OpenWA / Cloud API en tiempo real).
  useEffect(() => {
    if (!provider) return;
    const unsub = provider.onMessage((m) => {
      setMessagesByChat((prev) => ({ ...prev, [m.chatId]: [...(prev[m.chatId] ?? []), m] }));
      setChats((prev) => touchChats(prev, m, leadByPhone.get(m.chatId)?.name));
      // Registrar entrante como gestión si hay lead vinculado.
      if (m.from === "them" && currentUser) {
        const lead = leadByPhone.get(m.chatId);
        if (lead) {
          addInteraction({
            lead_id: lead.id,
            user_id: currentUser.id,
            type: "whatsapp",
            note: m.text,
          });
        }
      }
    });
    return unsub;
  }, [provider, leadByPhone, currentUser, addInteraction]);

  // Autoscroll al final.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activePhone, messagesByChat]);

  const activeChat = chats.find((c) => c.id === activePhone) ?? null;
  const activeMessages = activePhone ? (messagesByChat[activePhone] ?? []) : [];
  const activeLead = activePhone ? (leadByPhone.get(activePhone) ?? null) : null;

  const filtered = chats.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const lead = leadByPhone.get(c.id);
    const name = (lead?.name ?? c.name ?? c.phone).toLowerCase();
    return (
      name.includes(q) || c.phone.includes(q) || (c.lastMessage ?? "").toLowerCase().includes(q)
    );
  });

  const sendMessage = async () => {
    if (!draft.trim() || !activePhone || !provider) return;
    const text = draft.trim();
    setDraft("");
    const res = await provider.sendMessage(activePhone, text);
    if (res.status === "failed") {
      toast("No se pudo enviar el mensaje");
      return;
    }
    const msg: WaMessage = {
      id: res.id,
      chatId: activePhone,
      from: "me",
      text,
      at: res.at,
      status: res.status,
    };
    setMessagesByChat((prev) => ({ ...prev, [activePhone]: [...(prev[activePhone] ?? []), msg] }));
    setChats((prev) => touchChats(prev, msg, activeChat?.name ?? undefined));

    // Si hay lead vinculado, registrar automáticamente como gestión (whatsapp).
    if (activeLead && currentUser) {
      addInteraction({
        lead_id: activeLead.id,
        user_id: currentUser.id,
        type: "whatsapp",
        note: text,
      });
      setMessagesByChat((prev) => ({
        ...prev,
        [activePhone]: (prev[activePhone] ?? []).map((m) =>
          m.id === msg.id ? { ...m, status: "read" as const } : m,
        ),
      }));
    }
  };

  const changeStatus = (leadStatus: LeadStatus) => {
    if (!activeLead) return;
    updateLead(activeLead.id, { status: leadStatus });
    toast(`Estado actualizado: ${LEAD_STATUS_LABEL[leadStatus]}`);
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
    if (!activePhone || !activeChat) return;
    const lastText = activeMessages[activeMessages.length - 1]?.text ?? "";
    const lead = createLead({
      name: `Contacto WhatsApp ${activePhone.slice(-4)}`,
      phone: activePhone,
      source: "WhatsApp",
      status: "nuevo",
      temperature: "tibio",
      notes: lastText ? `Primer mensaje: ${lastText}` : null,
    });
    // Registrar los mensajes previos entrantes como historial.
    if (currentUser) {
      for (const m of activeMessages.filter((x) => x.from === "them")) {
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

  const description =
    providerId === "mock"
      ? "Gestioná leads sin salir del chat. La conversación es simulada; cambiá a OpenWA o a la API oficial sin tocar el CRM."
      : providerId === "openwa"
        ? "Conectado vía OpenWA (WhatsApp Web). Los mensajes son reales."
        : "Conectado vía WhatsApp Cloud API (Meta).";

  return (
    <div className="space-y-4">
      <PageHeader title="WhatsApp" description={description} />

      <ConnectionBanner status={status} />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Lista de conversaciones */}
        <Card className={cn("h-[70vh]", activeChat && "hidden lg:block")}>
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
              {filtered.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No hay conversaciones todavía.
                </p>
              )}
              {filtered.map((c) => {
                const lead = leadByPhone.get(c.id);
                const label = lead?.name ?? c.name ?? c.phone;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActivePhone(c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                      activePhone === c.id ? "bg-primary/10" : "hover:bg-accent",
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
                        {c.lastMessage ?? "Sin mensajes"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className={cn("h-[70vh]", !activeChat && "hidden lg:block")}>
          <CardContent className="flex h-full flex-col p-0">
            {activeChat ? (
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
                  <Avatar name={activeLead?.name ?? activeChat.name ?? activeChat.phone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {activeLead?.name ?? activeChat.name ?? activeChat.phone}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Phone className="size-3" /> {activeChat.phone}
                    </p>
                  </div>
                  {activeLead && <LeadStatusBadge status={activeLead.status} />}
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4 scrollbar-thin"
                >
                  {activeMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                          m.from === "me" ? "bg-primary text-primary-foreground" : "bg-card",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <div
                          className={cn(
                            "mt-1 flex items-center justify-end gap-1 text-[10px]",
                            m.from === "me"
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground",
                          )}
                        >
                          {new Date(m.at).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.from === "me" &&
                            (m.status === "read" || m.status === "delivered" ? (
                              <CheckCheck className="size-3" />
                            ) : (
                              <Check className="size-3" />
                            ))}
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
                          void sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder="Escribí un mensaje..."
                      className="min-h-11 resize-none"
                    />
                    <Button
                      onClick={() => void sendMessage()}
                      size="icon"
                      disabled={!draft.trim()}
                      aria-label="Enviar"
                      className="size-11 shrink-0"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                  {!activeLead && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Creá el lead desde el panel para que la conversación cuente como gestión.
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
        <Card className={cn("h-[70vh]", !activeChat && "hidden lg:block")}>
          <CardContent className="flex h-full flex-col gap-4 overflow-y-auto p-4 scrollbar-thin">
            {!activeChat ? (
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
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-2 text-xs",
                        s.className,
                      )}
                    >
                      <span className={cn("size-2 rounded-full", s.dotClass)} />
                      {s.label}
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Estado</label>
                  <Select
                    value={activeLead.status}
                    onChange={(e) => changeStatus(e.target.value as LeadStatus)}
                  >
                    {[
                      ...OPEN_PIPELINE,
                      "vendido",
                      ...CLOSED_STATUSES.filter((s) => s !== "vendido"),
                    ].map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_LABEL[s as LeadStatus]}
                      </option>
                    ))}
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
                  <p className="text-xs text-muted-foreground">{activeChat.phone}</p>
                </div>
                <Button className="w-full" onClick={createFromChat}>
                  <UserPlus className="size-4" /> Crear lead desde este chat
                </Button>
                <p className="text-xs text-muted-foreground">
                  Se cargará con origen "WhatsApp" y los mensajes previos quedarán como historial de
                  gestión.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
