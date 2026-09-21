// ─────────────────────────────────────────────────────────────
// Microservicio OpenWA para Atlas Sales OS
//
// Proceso Node PERSISTENTE que mantiene una sesión de WhatsApp Web mediante
// @open-wa/wa-automate (Chromium headless). Expone una API HTTP que consume
// el proveedor `openwa` del CRM (src/lib/whatsapp/openwa-provider.ts).
//
// ⚠️ NO se despliega en Cloudflare Workers. Corre en un VPS / contenedor /
//    máquina local (Railway, Render, Fly.io, un droplet, etc.).
//
// Endpoints:
//   GET  /status                     → { state, qr, me }
//   GET  /chats                      → WaChat[]
//   GET  /chats/:id/messages         → WaMessage[]
//   POST /send  { chatId, text }     → SendResult
//   GET  /events?since=<epochMs>     → WaMessage[]  (entrantes nuevos)
// ─────────────────────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import { create, ev } from "@open-wa/wa-automate";

// Windows 11 removió wmic.exe, y una dependencia interna de wa-automate lo
// spawnea para gestionar procesos de Chrome. Ese ENOENT llega como 'error'
// event no manejado y tumbaría el proceso. Lo ignoramos explícitamente.
process.on("uncaughtException", (err) => {
  const msg = String(err?.message ?? err);
  if (err?.code === "ENOENT" && /wmic/i.test(msg)) {
    console.warn("[openwa] wmic no disponible (Windows 11) — ignorado, no afecta el QR.");
    return;
  }
  console.error("[openwa] uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[openwa] unhandledRejection:", reason);
});

const PORT = Number(process.env.PORT ?? 3100);
const SESSION_ID = process.env.WA_SESSION ?? "atlas-sales";
const AUTH_TOKEN = process.env.AUTH_TOKEN ?? ""; // opcional
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
// Chrome instalado (más compatible con WhatsApp Web Multi-Device que el
// Chromium de puppeteer). Configurable con CHROME_PATH.
const CHROME_PATH =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// ── Estado en memoria (para el demo). En producción, persistir en DB. ──
const state = {
  connection: "connecting", // connecting | qr | connected | disconnected | error
  qr: null, // data URL del QR mientras está pendiente
  me: null, // número vinculado
};
/** Buffer de mensajes entrantes: { id, chatId, from:"them", text, at }. */
const inbound = [];
let waClient = null;

// ── Helpers ──
const digits = (v) => String(v ?? "").replace(/\D/g, "");
const toChatId = (phone) => `${digits(phone)}@c.us`; // formato interno de WhatsApp

function pushInbound(msg) {
  inbound.push(msg);
  // Acotar el buffer para no crecer indefinido en el demo.
  if (inbound.length > 5000) inbound.splice(0, inbound.length - 5000);
}

// ── App HTTP ──
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Auth opcional por Bearer token.
app.use((req, res, next) => {
  if (!AUTH_TOKEN) return next();
  const header = req.headers.authorization ?? "";
  if (header === `Bearer ${AUTH_TOKEN}`) return next();
  return res.status(401).json({ error: "unauthorized" });
});

app.get("/status", (_req, res) => {
  res.json({ state: state.connection, qr: state.qr, me: state.me });
});

app.get("/chats", async (_req, res) => {
  if (!waClient) return res.json([]);
  try {
    const chats = await waClient.getAllChats();
    const mapped = chats
      .filter((c) => c.id?._serialized?.endsWith("@c.us")) // solo contactos individuales
      .map((c) => {
        const phone = digits(c.id.user ?? c.id._serialized);
        const last = c.msgs?.[c.msgs.length - 1];
        return {
          id: phone,
          phone,
          name: c.formattedTitle ?? c.name ?? phone,
          lastMessage: last?.body ?? null,
          lastAt: last?.t ? new Date(last.t * 1000).toISOString() : null,
          unread: c.unreadCount ?? 0,
        };
      });
    res.json(mapped);
  } catch (e) {
    console.error("GET /chats", e);
    res.json([]);
  }
});

app.get("/chats/:id/messages", async (req, res) => {
  if (!waClient) return res.json([]);
  try {
    const chatId = toChatId(req.params.id);
    const msgs = await waClient.getAllMessagesInChat(chatId, true, true);
    const mapped = msgs.map((m) => ({
      id: m.id,
      chatId: digits(req.params.id),
      from: m.fromMe ? "me" : "them",
      text: m.body ?? m.caption ?? "",
      at: m.t ? new Date(m.t * 1000).toISOString() : new Date().toISOString(),
      status: m.fromMe ? "sent" : undefined,
    }));
    res.json(mapped);
  } catch (e) {
    console.error("GET /chats/:id/messages", e);
    res.json([]);
  }
});

app.post("/send", async (req, res) => {
  const { chatId, text } = req.body ?? {};
  if (!chatId || !text) return res.status(400).json({ error: "chatId y text requeridos" });
  if (!waClient) return res.status(503).json({ id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" });
  try {
    await waClient.sendText(toChatId(chatId), text);
    res.json({ id: `out-${Date.now()}`, at: new Date().toISOString(), status: "sent" });
  } catch (e) {
    console.error("POST /send", e);
    res.status(500).json({ id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" });
  }
});

app.get("/events", (req, res) => {
  const since = Number(req.query.since ?? 0);
  res.json(inbound.filter((m) => Date.parse(m.at) > since));
});

app.listen(PORT, () => {
  console.log(`[openwa] HTTP escuchando en http://localhost:${PORT}`);
});

// ── QR: se emite antes de que exista el cliente ──
ev.on("qr.**", (qrcode) => {
  // qrcode ya viene como data URL base64 (image/png).
  state.connection = "qr";
  state.qr = qrcode;
  console.log("[openwa] QR generado — escaneá desde WhatsApp → Dispositivos vinculados");
});

// ── Arranque del cliente WhatsApp ──
create({
  sessionId: SESSION_ID,
  multiDevice: true,
  headless: process.env.WA_HEADLESS === "true", // visible por default (mejor render del QR)
  qrTimeout: 0, // no expira mientras esperás el escaneo
  authTimeout: 60, // más margen para que cargue WhatsApp Web
  cacheEnabled: false,
  useChrome: true, // usa Chrome instalado (mejor soporte Multi-Device)
  executablePath: CHROME_PATH,
  killProcessOnBrowserClose: false,
  disableSpins: true,
  qrLogSkip: false,
})
  .then(start)
  .catch((e) => {
    console.error("[openwa] error al crear el cliente", e);
    state.connection = "error";
  });

async function start(client) {
  waClient = client;
  state.connection = "connected";
  state.qr = null;
  try {
    const me = await client.getMe();
    state.me = digits(me?.id?.user ?? me?.wid?.user ?? "") || "conectado";
  } catch {
    state.me = "conectado";
  }
  console.log(`[openwa] conectado como ${state.me}`);

  // Mensajes entrantes → buffer /events
  client.onMessage((message) => {
    if (message.fromMe) return;
    if (!message.from?.endsWith("@c.us")) return; // ignorar grupos/estados
    pushInbound({
      id: message.id,
      chatId: digits(message.from),
      from: "them",
      text: message.body ?? message.caption ?? "",
      at: message.t ? new Date(message.t * 1000).toISOString() : new Date().toISOString(),
    });
  });

  // Cambios de estado de conexión
  client.onStateChanged((s) => {
    console.log("[openwa] state:", s);
    if (s === "CONNECTED") state.connection = "connected";
    else if (["UNPAIRED", "UNPAIRED_IDLE", "CONFLICT"].includes(s)) state.connection = "disconnected";
  });
}
