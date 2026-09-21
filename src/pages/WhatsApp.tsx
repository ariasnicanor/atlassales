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
  QrCode,
  Loader2,
  X,
  Smile,
  Paperclip,
  MoreVertical,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

/** Hora corta estilo WhatsApp (HH:MM). */
function shortTime(at?: string | null) {
  if (!at) return "";
  return new Date(at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/** Chip/panel de estado de conexión. Muestra el QR cuando hay que vincular. */
function ConnectionBar({ status }: { status: WaProviderStatus | null }) {
  if (!status || status.provider === "mock") return null;
  if (status.state === "connected") return null;

  const qrSrc = status.qr
    ? status.qr.startsWith("data:")
      ? status.qr
      : `data:image/png;base64,${status.qr}`
    : null;

  const tone =
    status.state === "qr"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : status.state === "connecting"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
        : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center",
        tone,
      )}
    >
      <div className="flex items-center gap-2">
        {status.state === "connecting" ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <QrCode className="size-4 shrink-0" />
        )}
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
            WhatsApp → Dispositivos vinculados → Vincular dispositivo.
          </p>
        </div>
      )}
    </div>
  );
}

/** Avatar redondo estilo WhatsApp. */
function WaAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] font-medium text-[#54656f] dark:bg-[#6a7175] dark:text-[#cfd4d6]"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
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
  const [showInfo, setShowInfo] = useState(false);
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

  const openChat = (id: string) => {
    setActivePhone(id);
    setShowInfo(false);
  };

  const headerTitle = activeLead?.name ?? activeChat?.name ?? activeChat?.phone ?? "";

  return (
    <div className="flex flex-col gap-3">
      <ConnectionBar status={status} />

      {/* Contenedor tipo WhatsApp Web */}
      <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#111b21]">
        {/* ── Panel lista de chats ── */}
        <aside
          className={cn(
            "flex w-full flex-col border-r border-black/10 bg-white dark:border-white/10 dark:bg-[#111b21] md:w-[360px]",
            activeChat && "hidden md:flex",
          )}
        >
          {/* Header del panel: estado de conexión */}
          <div className="flex items-center justify-between gap-2 bg-[#f0f2f5] px-4 py-3 dark:bg-[#202c33]">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5 text-[#008069] dark:text-[#00a884]" />
              <span className="font-semibold text-[#111b21] dark:text-[#e9edef]">Chats</span>
            </div>
            {status && (
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  status.state === "connected"
                    ? "bg-[#008069]/10 text-[#008069] dark:bg-[#00a884]/15 dark:text-[#00a884]"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
                title={status.label}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    status.state === "connected"
                      ? "bg-[#008069] dark:bg-[#00a884]"
                      : "bg-amber-500",
                  )}
                />
                {providerId === "mock"
                  ? "Demo"
                  : status.state === "connected"
                    ? "En línea"
                    : status.state === "qr"
                      ? "Vincular"
                      : "…"}
              </span>
            )}
          </div>

          {/* Buscador */}
          <div className="bg-white px-3 py-2 dark:bg-[#111b21]">
            <div className="flex items-center gap-3 rounded-lg bg-[#f0f2f5] px-3 py-1.5 dark:bg-[#202c33]">
              <Search className="size-4 text-[#54656f] dark:text-[#8696a0]" />
              <input
                placeholder="Buscar un chat"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#8696a0] dark:text-[#e9edef]"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-[#8696a0]">
                No hay conversaciones todavía.
              </p>
            )}
            {filtered.map((c) => {
              const lead = leadByPhone.get(c.id);
              const label = lead?.name ?? c.name ?? c.phone;
              return (
                <button
                  key={c.id}
                  onClick={() => openChat(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    activePhone === c.id
                      ? "bg-[#f0f2f5] dark:bg-[#2a3942]"
                      : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]",
                  )}
                >
                  <WaAvatar name={label} size={49} />
                  <div className="min-w-0 flex-1 border-b border-black/5 pb-2.5 dark:border-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[15px] font-medium text-[#111b21] dark:text-[#e9edef]">
                        {label}
                      </p>
                      <span className="shrink-0 text-[11px] text-[#667781] dark:text-[#8696a0]">
                        {shortTime(c.lastAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] text-[#667781] dark:text-[#8696a0]">
                        {c.lastMessage ?? "Sin mensajes"}
                      </p>
                      {!lead && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-[#008069]/30 text-[9px] text-[#008069] dark:text-[#00a884]"
                        >
                          Sin lead
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Panel de conversación ── */}
        <section
          className={cn(
            "relative flex flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a]",
            !activeChat && "hidden md:flex",
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10S0 14.5 0 20s4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        >
          {activeChat ? (
            <>
              {/* Header del chat */}
              <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-2 dark:bg-[#202c33]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setActivePhone(null)}
                  aria-label="Volver"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setShowInfo(true)}
                >
                  <WaAvatar name={headerTitle} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-[#111b21] dark:text-[#e9edef]">
                      {headerTitle}
                    </p>
                    <p className="truncate text-[12px] text-[#667781] dark:text-[#8696a0]">
                      {activeChat.phone}
                    </p>
                  </div>
                </button>
                {activeLead && <LeadStatusBadge status={activeLead.status} />}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfo((v) => !v)}
                  aria-label="Datos del contacto"
                  title="Datos del contacto"
                >
                  <Info className="size-5 text-[#54656f] dark:text-[#aebac1]" />
                </Button>
                <MoreVertical className="hidden size-5 text-[#54656f] dark:text-[#aebac1] sm:block" />
              </div>

              {/* Mensajes */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4 scrollbar-thin sm:px-[8%]"
              >
                {activeMessages.map((m) => {
                  const mine = m.from === "me";
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "relative max-w-[75%] rounded-lg px-2.5 py-1.5 text-[14px] shadow-sm",
                          mine
                            ? "bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]"
                            : "bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words pr-12">{m.text}</p>
                        <span className="float-right -mb-1 ml-2 mt-1 flex items-center gap-1 text-[10px] text-[#667781] dark:text-[#8696a0]">
                          {shortTime(m.at)}
                          {mine &&
                            (m.status === "read" ? (
                              <CheckCheck className="size-3.5 text-[#53bdeb]" />
                            ) : m.status === "delivered" ? (
                              <CheckCheck className="size-3.5" />
                            ) : (
                              <Check className="size-3.5" />
                            ))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra de entrada */}
              <div className="flex items-end gap-2 bg-[#f0f2f5] px-4 py-2.5 dark:bg-[#202c33]">
                <Smile className="mb-2 size-6 shrink-0 text-[#54656f] dark:text-[#8696a0]" />
                <Paperclip className="mb-2 size-6 shrink-0 text-[#54656f] dark:text-[#8696a0]" />
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
                  placeholder="Escribí un mensaje"
                  className="min-h-10 resize-none rounded-lg border-0 bg-white text-[14px] shadow-none focus-visible:ring-0 dark:bg-[#2a3942]"
                />
                <Button
                  onClick={() => void sendMessage()}
                  size="icon"
                  disabled={!draft.trim()}
                  aria-label="Enviar"
                  className="size-10 shrink-0 rounded-full bg-[#008069] hover:bg-[#017561] dark:bg-[#00a884] dark:hover:bg-[#06cf9c]"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#dfe5e7] dark:bg-[#202c33]">
                <MessageCircle className="size-10 text-[#54656f] dark:text-[#8696a0]" />
              </div>
              <p className="text-lg font-light text-[#41525d] dark:text-[#e9edef]">
                Atlas Sales · WhatsApp
              </p>
              <p className="max-w-sm text-sm text-[#667781] dark:text-[#8696a0]">
                Elegí una conversación para gestionar leads sin salir del chat.
              </p>
            </div>
          )}
        </section>

        {/* ── Panel info del contacto (gestión CRM) ── */}
        {activeChat && showInfo && (
          <aside className="absolute inset-0 z-10 flex flex-col border-l border-black/10 bg-white dark:border-white/10 dark:bg-[#111b21] md:static md:z-0 md:w-[380px]">
            <div className="flex items-center gap-4 bg-[#f0f2f5] px-4 py-3.5 dark:bg-[#202c33]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfo(false)}
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </Button>
              <span className="font-medium text-[#111b21] dark:text-[#e9edef]">
                Datos del contacto
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 border-b border-black/5 bg-white px-4 py-6 dark:border-white/5 dark:bg-[#111b21]">
              <WaAvatar name={headerTitle} size={96} />
              <p className="mt-2 text-lg font-medium text-[#111b21] dark:text-[#e9edef]">
                {headerTitle}
              </p>
              <p className="flex items-center gap-1 text-sm text-[#667781] dark:text-[#8696a0]">
                <Phone className="size-3.5" /> {activeChat.phone}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {activeLead ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#008069] dark:text-[#00a884]">
                      Lead en el CRM
                    </span>
                    <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <Link to={`/leads/${activeLead.id}`}>
                        Abrir <ExternalLink className="size-3.5" />
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

                  <Button variant="outline" size="sm" className="w-full" onClick={logManagement}>
                    Marcar como gestionado ahora
                  </Button>
                </div>
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
                    Se cargará con origen "WhatsApp" y los mensajes previos quedarán como historial
                    de gestión.
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
