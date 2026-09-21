// ─────────────────────────────────────────────────────────────
// Microservicio de WhatsApp para Atlas Sales OS — motor whatsapp-web.js
//
// Alternativa a server.js (OpenWA), que dejó de ser compatible con la versión
// actual de WhatsApp Web. Expone EXACTAMENTE el mismo contrato HTTP, así que
// el CRM (proveedor `openwa`) no cambia en nada.
//
// ⚠️ Sigue siendo una vía NO oficial (riesgo de baneo) y NO corre en
//    Cloudflare/Vercel: necesita un proceso Node persistente con Chrome.
//
// Endpoints:
//   GET  /status                 → { state, qr, me }
//   GET  /chats                  → WaChat[]
//   GET  /chats/:id/messages     → WaMessage[]
//   POST /send { chatId, text }  → SendResult
//   GET  /events?since=<epochMs> → WaMessage[]  (entrantes nuevos)
// ─────────────────────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import qrcode from "qrcode";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

// Windows 11 removió wmic.exe; puppeteer/deps pueden spawnearlo. Evitamos el crash.
process.on("uncaughtException", (err) => {
  const msg = String(err?.message ?? err);
  if (err?.code === "ENOENT" && /wmic/i.test(msg)) {
    console.warn("[wa] wmic no disponible (Windows 11) — ignorado.");
    return;
  }
  console.error("[wa] uncaughtException:", err);
});
process.on("unhandledRejection", (r) => console.error("[wa] unhandledRejection:", r));

const PORT = Number(process.env.PORT ?? 3100);
const SESSION_ID = process.env.WA_SESSION ?? "atlas-sales";
const AUTH_TOKEN = process.env.AUTH_TOKEN ?? "";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
// Si no se define CHROME_PATH, usa el Chromium que trae whatsapp-web.js
// (versión testeada con la librería; evita "Execution context was destroyed"
// con Chrome del sistema demasiado nuevo).
const CHROME_PATH = process.env.CHROME_PATH || undefined;
const HEADLESS = process.env.WA_HEADLESS !== "false"; // headless por default

const state = { connection: "connecting", qr: null, me: null };
const inbound = [];
const digits = (v) => String(v ?? "").replace(/\D/g, "");
const toChatId = (phone) => `${digits(phone)}@c.us`;

function pushInbound(m) {
  inbound.push(m);
  if (inbound.length > 5000) inbound.splice(0, inbound.length - 5000);
}

// ── HTTP ──
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use((req, res, next) => {
  if (!AUTH_TOKEN) return next();
  if (req.headers.authorization === `Bearer ${AUTH_TOKEN}`) return next();
  return res.status(401).json({ error: "unauthorized" });
});

app.get("/status", (_req, res) =>
  res.json({ state: state.connection, qr: state.qr, me: state.me }),
);

app.get("/chats", async (_req, res) => {
  if (state.connection !== "connected") return res.json([]);
  try {
    const chats = await client.getChats();
    const mapped = chats
      .filter((c) => !c.isGroup && c.id?._serialized?.endsWith("@c.us"))
      .slice(0, 50)
      .map((c) => ({
        id: digits(c.id.user ?? c.id._serialized),
        phone: digits(c.id.user ?? c.id._serialized),
        name: c.name ?? digits(c.id.user),
        lastMessage: c.lastMessage?.body ?? null,
        lastAt: c.lastMessage?.timestamp
          ? new Date(c.lastMessage.timestamp * 1000).toISOString()
          : null,
        unread: c.unreadCount ?? 0,
      }));
    res.json(mapped);
  } catch (e) {
    console.error("GET /chats", e);
    res.json([]);
  }
});

app.get("/chats/:id/messages", async (req, res) => {
  if (state.connection !== "connected") return res.json([]);
  try {
    const chat = await client.getChatById(toChatId(req.params.id));
    const msgs = await chat.fetchMessages({ limit: 50 });
    res.json(
      msgs.map((m) => ({
        id: m.id?._serialized ?? m.id?.id ?? `m-${m.timestamp}`,
        chatId: digits(req.params.id),
        from: m.fromMe ? "me" : "them",
        text: m.body ?? "",
        at: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : new Date().toISOString(),
        status: m.fromMe ? "sent" : undefined,
      })),
    );
  } catch (e) {
    console.error("GET /chats/:id/messages", e);
    res.json([]);
  }
});

app.post("/send", async (req, res) => {
  const { chatId, text } = req.body ?? {};
  if (!chatId || !text) return res.status(400).json({ error: "chatId y text requeridos" });
  if (state.connection !== "connected")
    return res.status(503).json({ id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" });
  try {
    const sent = await client.sendMessage(toChatId(chatId), text);
    res.json({
      id: sent.id?._serialized ?? `out-${Date.now()}`,
      at: new Date().toISOString(),
      status: "sent",
    });
  } catch (e) {
    console.error("POST /send", e);
    res.status(500).json({ id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" });
  }
});

app.get("/events", (req, res) => {
  const since = Number(req.query.since ?? 0);
  res.json(inbound.filter((m) => Date.parse(m.at) > since));
});

app.listen(PORT, () => console.log(`[wa] HTTP escuchando en http://localhost:${PORT}`));

// ── Cliente WhatsApp ──
// Fija una versión de WhatsApp Web conocida para evitar
// "Execution context was destroyed" con la build más nueva.
const WA_WEB_VERSION = process.env.WA_WEB_VERSION ?? "2.3000.1047967752-alpha";
const client = new Client({
  authStrategy: new LocalAuth({ clientId: SESSION_ID, dataPath: "./_wwebjs_auth" }),
  webVersion: WA_WEB_VERSION,
  webVersionCache: {
    type: "remote",
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${WA_WEB_VERSION}.html`,
  },
  puppeteer: {
    headless: HEADLESS,
    ...(CHROME_PATH ? { executablePath: CHROME_PATH } : {}),
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", async (qr) => {
  try {
    state.qr = await qrcode.toDataURL(qr); // data URL PNG para el banner del CRM
    state.connection = "qr";
    console.log("[wa] QR generado — escaneá desde WhatsApp → Dispositivos vinculados.");
  } catch (e) {
    console.error("[wa] error generando QR", e);
  }
});

client.on("authenticated", () => console.log("[wa] autenticado"));
client.on("loading_screen", (p, m) => console.log(`[wa] cargando ${p}% ${m}`));

client.on("ready", async () => {
  state.connection = "connected";
  state.qr = null;
  try {
    state.me = digits(client.info?.wid?.user ?? "") || "conectado";
  } catch {
    state.me = "conectado";
  }
  console.log(`[wa] conectado como ${state.me}`);
});

client.on("message", (message) => {
  if (message.fromMe) return;
  if (!message.from?.endsWith("@c.us")) return; // ignorar grupos/estados
  pushInbound({
    id: message.id?._serialized ?? `in-${Date.now()}`,
    chatId: digits(message.from),
    from: "them",
    text: message.body ?? "",
    at: message.timestamp ? new Date(message.timestamp * 1000).toISOString() : new Date().toISOString(),
  });
});

client.on("disconnected", (reason) => {
  console.log("[wa] desconectado:", reason);
  state.connection = "disconnected";
});

client.initialize().catch((e) => {
  console.error("[wa] error al inicializar", e);
  state.connection = "error";
});
