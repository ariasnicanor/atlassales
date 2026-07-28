/**
 * Google Calendar integration (simulated).
 *
 * Estructura lista para conectar credenciales reales de OAuth más adelante.
 * Por ahora la conexión se simula y persiste en localStorage por usuario.
 *
 * Cuando se enchufen las credenciales reales, reemplazar:
 *  - `connectGoogleCalendar()` por el flujo OAuth real (popup + code exchange).
 *  - `pushEventToGoogle()` por POST a https://www.googleapis.com/calendar/v3/calendars/primary/events
 *  - `pullEventsFromGoogle()` por GET al mismo endpoint con syncToken.
 */

export type GCalConnectionStatus = "disconnected" | "connected" | "error";

export interface GCalConnection {
  status: GCalConnectionStatus;
  email: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
  /** Modo actual: mock (sin credenciales) u oauth (real). */
  mode: "mock" | "oauth";
  /** Reservado para el token real cuando esté disponible. Nunca poblarlo en cliente en prod. */
  access_token?: string | null;
  refresh_token?: string | null;
}

export interface SyncableEvent {
  id: string;
  source: "crm-task" | "crm-followup" | "crm-event" | "google";
  title: string;
  description?: string;
  start: string; // ISO
  end?: string; // ISO
  lead_id?: string | null;
  google_event_id?: string | null;
}

const KEY = (userId: string) => `atlas-sales-os:gcal:${userId}`;
const MIRROR_KEY = (userId: string) => `atlas-sales-os:gcal-mirror:${userId}`;

export function getConnection(userId: string): GCalConnection {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (raw) return JSON.parse(raw) as GCalConnection;
  } catch {}
  return {
    status: "disconnected",
    email: null,
    connected_at: null,
    last_sync_at: null,
    mode: hasRealCredentials() ? "oauth" : "mock",
  };
}

function saveConnection(userId: string, conn: GCalConnection) {
  localStorage.setItem(KEY(userId), JSON.stringify(conn));
  window.dispatchEvent(new CustomEvent("gcal:changed", { detail: { userId } }));
}

/** ¿Hay credenciales reales configuradas? (VITE_GOOGLE_CLIENT_ID). */
export function hasRealCredentials(): boolean {
  try {
    // @ts-expect-error import.meta.env narrowing
    return Boolean(import.meta.env?.VITE_GOOGLE_CLIENT_ID);
  } catch {
    return false;
  }
}

/**
 * Inicia el flujo de conexión.
 * - Si hay credenciales reales: abriría el OAuth popup (TODO real).
 * - Sin credenciales: simula la conexión con el email del usuario.
 */
export async function connectGoogleCalendar(
  userId: string,
  fallbackEmail: string,
): Promise<GCalConnection> {
  if (hasRealCredentials()) {
    // TODO: implementar OAuth real con google.accounts.oauth2 o gapi.
    // const token = await runGoogleOAuth();
    // return saveOAuthConnection(userId, token);
  }
  // Simulación
  await new Promise((r) => setTimeout(r, 600));
  const conn: GCalConnection = {
    status: "connected",
    email: fallbackEmail,
    connected_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    mode: "mock",
  };
  saveConnection(userId, conn);
  return conn;
}

export function disconnectGoogleCalendar(userId: string) {
  const conn: GCalConnection = {
    status: "disconnected",
    email: null,
    connected_at: null,
    last_sync_at: null,
    mode: hasRealCredentials() ? "oauth" : "mock",
  };
  saveConnection(userId, conn);
  localStorage.removeItem(MIRROR_KEY(userId));
}

/**
 * Empuja un evento al calendario (simulado: se guarda en el "mirror" local
 * que representa lo que estaría en Google).
 */
export function pushEventToGoogle(userId: string, ev: SyncableEvent) {
  const conn = getConnection(userId);
  if (conn.status !== "connected") return;
  const mirror = readMirror(userId);
  const google_event_id = ev.google_event_id ?? `gcal_${Math.random().toString(36).slice(2, 10)}`;
  const idx = mirror.findIndex((e) => e.id === ev.id);
  const next: SyncableEvent = { ...ev, google_event_id };
  if (idx >= 0) mirror[idx] = next;
  else mirror.push(next);
  writeMirror(userId, mirror);
  touchSync(userId);
}

export function removeEventFromGoogle(userId: string, eventId: string) {
  const conn = getConnection(userId);
  if (conn.status !== "connected") return;
  const mirror = readMirror(userId).filter((e) => e.id !== eventId);
  writeMirror(userId, mirror);
  touchSync(userId);
}

/**
 * Trae eventos del calendario (simulado: devuelve lo del mirror).
 * En real: llamada a events.list con syncToken incremental.
 */
export function pullEventsFromGoogle(userId: string): SyncableEvent[] {
  const conn = getConnection(userId);
  if (conn.status !== "connected") return [];
  touchSync(userId);
  return readMirror(userId);
}

function readMirror(userId: string): SyncableEvent[] {
  try {
    return JSON.parse(localStorage.getItem(MIRROR_KEY(userId)) ?? "[]");
  } catch {
    return [];
  }
}
function writeMirror(userId: string, items: SyncableEvent[]) {
  localStorage.setItem(MIRROR_KEY(userId), JSON.stringify(items));
}
function touchSync(userId: string) {
  const conn = getConnection(userId);
  if (conn.status !== "connected") return;
  saveConnection(userId, { ...conn, last_sync_at: new Date().toISOString() });
}
