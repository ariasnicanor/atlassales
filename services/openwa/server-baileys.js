// ─────────────────────────────────────────────────────────────
// Microservicio de WhatsApp para Atlas Sales OS — motor Baileys
//
// A diferencia de OpenWA / whatsapp-web.js, Baileys NO usa Chromium: habla el
// protocolo nativo de WhatsApp (WebSocket Multi-Device). Por eso evita los
// errores de Puppeteer (wmic, "execution context destroyed", timeouts).
//
// Mismo contrato HTTP que los otros motores, así el CRM (proveedor `openwa`)
// no cambia:
//   GET  /status                 → { state, qr, me }
//   GET  /chats                  → WaChat[]
//   GET  /chats/:id/messages     → WaMessage[]
//   POST /send { chatId, text }  → SendResult
//   GET  /events?since=<epochMs> → WaMessage[]
//
// ⚠️ Sigue siendo NO oficial (riesgo de baneo) y NO corre en Cloudflare/Vercel.
//    Conectá un teléfono que puedas permitirte perder.
// ─────────────────────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import qrcode from "qrcode";
import pino from "pino";
import * as baileys from "@whiskeysockets/baileys";

const makeWASocket = baileys.default ?? baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

const PORT = Number(process.env.PORT ?? 3100);
const AUTH_DIR = process.env.WA_AUTH_DIR ?? "./_baileys_auth";
const AUTH_TOKEN = process.env.AUTH_TOKEN ?? "";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const state = { connection: "connecting", qr: null, me: null };
const inbound = []; // { id, chatId, from:"them", text, at }
const chats = new Map(); // chatId -> { id, phone, name, lastMessage, lastAt }
const messagesByChat = new Map(); // chatId -> WaMessage[]

const digits = (v) => String(v ?? "").replace(/\D/g, "");
const toJid = (phone) => `${digits(phone)}@s.whatsapp.net`;
const fromJid = (jid) => digits(String(jid ?? "").split("@")[0].split(":")[0]);

function pushInbound(m) {
  inbound.push(m);
  if (inbound.length > 5000) inbound.splice(0, inbound.length - 5000);
}
function recordMessage(m) {
  const arr = messagesByChat.get(m.chatId) ?? [];
  arr.push(m);
  messagesByChat.set(m.chatId, arr.slice(-200));
  const existing = chats.get(m.chatId) ?? { id: m.chatId, phone: m.chatId, name: m.chatId };
  chats.set(m.chatId, { ...existing, lastMessage: m.text, lastAt: m.at });
}

// ── HTTP ──
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
// Healthcheck público (sin token) para Railway/monitores.
app.get("/health", (_req, res) => res.json({ ok: true, state: state.connection }));

app.use((req, res, next) => {
  if (!AUTH_TOKEN) return next();
  if (req.headers.authorization === `Bearer ${AUTH_TOKEN}`) return next();
  return res.status(401).json({ error: "unauthorized" });
});

app.get("/status", (_req, res) =>
  res.json({ state: state.connection, qr: state.qr, me: state.me }),
);

app.get("/chats", (_req, res) =>
  res.json(
    [...chats.values()].sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? "")),
  ),
);

app.get("/chats/:id/messages", (req, res) =>
  res.json(messagesByChat.get(digits(req.params.id)) ?? []),
);

let sock = null;
app.post("/send", async (req, res) => {
  const { chatId, text } = req.body ?? {};
  if (!chatId || !text) return res.status(400).json({ error: "chatId y text requeridos" });
  if (state.connection !== "connected" || !sock)
    return res
      .status(503)
      .json({ id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" });
  try {
    const sent = await sock.sendMessage(toJid(chatId), { text });
    const at = new Date().toISOString();
    recordMessage({ id: sent?.key?.id ?? `out-${Date.now()}`, chatId: digits(chatId), from: "me", text, at, status: "sent" });
    res.json({ id: sent?.key?.id ?? `out-${Date.now()}`, at, status: "sent" });
  } catch (e) {
    console.error("POST /send", e);
    res.status(500).json({ id: `failed-${Date.now()}`, at: new Date().toISOString(), status: "failed" });
  }
});

app.get("/events", (req, res) => {
  const since = Number(req.query.since ?? 0);
  res.json(inbound.filter((m) => Date.parse(m.at) > since));
});

app.listen(PORT, () => console.log(`[baileys] HTTP escuchando en http://localhost:${PORT}`));

// ── Conexión WhatsApp ──
async function start() {
  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  console.log(`[baileys] usando WA v${version.join(".")}`);

  sock = makeWASocket({
    version,
    auth: authState,
    logger: pino({ level: "silent" }),
    browser: ["Atlas Sales OS", "Chrome", "1.0.0"],
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      try {
        state.qr = await qrcode.toDataURL(qr);
        state.connection = "qr";
        console.log("[baileys] QR generado — escaneá desde WhatsApp → Dispositivos vinculados.");
      } catch (e) {
        console.error("[baileys] error generando QR", e);
      }
    }
    if (connection === "open") {
      state.connection = "connected";
      state.qr = null;
      state.me = fromJid(sock.user?.id) || "conectado";
      console.log(`[baileys] conectado como ${state.me}`);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`[baileys] conexión cerrada (code=${code}). ${loggedOut ? "Sesión cerrada." : "Reintentando..."}`);
      state.connection = loggedOut ? "disconnected" : "connecting";
      if (!loggedOut) start().catch((e) => console.error("[baileys] retry error", e));
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    // Diagnóstico: registrar todo lo que llega antes de filtrar.
    console.log(
      `[baileys] upsert type=${type} count=${messages.length} jids=${messages
        .map((m) => m.key?.remoteJid)
        .join(",")}`,
    );
    if (type !== "notify" && type !== "append") return;
    for (const msg of messages) {
      const jid = msg.key?.remoteJid ?? "";
      if (!jid.endsWith("@s.whatsapp.net")) continue; // solo chats individuales
      const text =
        msg.message?.conversation ??
        msg.message?.extendedTextMessage?.text ??
        msg.message?.imageMessage?.caption ??
        "";
      const chatId = fromJid(jid);
      const at = msg.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();
      if (msg.key?.fromMe) {
        recordMessage({ id: msg.key.id, chatId, from: "me", text, at, status: "sent" });
      } else {
        const m = { id: msg.key.id, chatId, from: "them", text, at };
        pushInbound(m);
        recordMessage(m);
        if (msg.pushName) {
          const c = chats.get(chatId);
          if (c) c.name = msg.pushName;
        }
      }
    }
  });
}

start().catch((e) => {
  console.error("[baileys] error al iniciar", e);
  state.connection = "error";
});
