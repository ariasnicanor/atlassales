// ─────────────────────────────────────────────────────────────
// Pixel & campaign tracking
// - Meta / Facebook Pixel
// - Google Ads (gtag) conversion tracking
// - UTM capture (persistidos en sessionStorage para atribuir al lead)
// Estructura lista para cargar IDs reales desde Settings (Admin) o
// vía variables de entorno VITE_META_PIXEL_ID / VITE_GOOGLE_ADS_ID /
// VITE_GOOGLE_ADS_LEAD_LABEL.
// ─────────────────────────────────────────────────────────────

export interface TrackingConfig {
  meta_pixel_id: string;
  google_ads_id: string;         // Ej: AW-123456789
  google_ads_lead_label: string; // Ej: abcDEFghi (send_to = AW-XXX/LABEL)
}

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_url?: string;
  captured_at?: string;
}

const STORAGE_KEY = "atlas-tracking-config-v1";
const UTM_KEY = "atlas-utm-v1";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ── Config ───────────────────────────────────────────────────

function fromEnv(): Partial<TrackingConfig> {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
  return {
    meta_pixel_id: env.VITE_META_PIXEL_ID ?? "",
    google_ads_id: env.VITE_GOOGLE_ADS_ID ?? "",
    google_ads_lead_label: env.VITE_GOOGLE_ADS_LEAD_LABEL ?? "",
  };
}

export function getTrackingConfig(): TrackingConfig {
  const base: TrackingConfig = { meta_pixel_id: "", google_ads_id: "", google_ads_lead_label: "" };
  const env = fromEnv();
  let stored: Partial<TrackingConfig> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) as Partial<TrackingConfig>;
    } catch { /* ignore */ }
  }
  return {
    meta_pixel_id: stored.meta_pixel_id || env.meta_pixel_id || base.meta_pixel_id,
    google_ads_id: stored.google_ads_id || env.google_ads_id || base.google_ads_id,
    google_ads_lead_label: stored.google_ads_lead_label || env.google_ads_lead_label || base.google_ads_lead_label,
  };
}

export function saveTrackingConfig(cfg: TrackingConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event("tracking:changed"));
}

export function hasMetaPixel(cfg = getTrackingConfig()) {
  return /^\d{6,}$/.test(cfg.meta_pixel_id.trim());
}

export function hasGoogleAds(cfg = getTrackingConfig()) {
  return /^AW-\w+/i.test(cfg.google_ads_id.trim());
}

// ── UTM capture ─────────────────────────────────────────────

export function captureUtmFromLocation(): UtmParams | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const captured: UtmParams = {};
  let found = false;
  for (const key of UTM_FIELDS) {
    const value = params.get(key);
    if (value) { (captured as Record<string, string>)[key] = value; found = true; }
  }
  if (!found) return getStoredUtm();
  captured.landing_url = window.location.href;
  captured.captured_at = new Date().toISOString();
  try {
    window.sessionStorage.setItem(UTM_KEY, JSON.stringify(captured));
  } catch { /* ignore */ }
  return captured;
}

export function getStoredUtm(): UtmParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(UTM_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : null;
  } catch { return null; }
}

export function clearStoredUtm() {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(UTM_KEY); } catch { /* ignore */ }
}

// ── Script injection ────────────────────────────────────────

function injectMetaPixel(id: string) {
  if (typeof window === "undefined" || window.fbq || !id) return;
  /* eslint-disable */
  (function (f: any, b: any, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true; t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq!("init", id);
  window.fbq!("track", "PageView");
}

function injectGoogleAds(id: string) {
  if (typeof window === "undefined" || !id) return;
  const existing = document.querySelector(`script[data-gtag="${id}"]`);
  if (existing) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  s.dataset.gtag = id;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function (...args: unknown[]) { window.dataLayer!.push(args); };
  window.gtag("js", new Date());
  window.gtag("config", id);
}

export function initTrackingPixels() {
  const cfg = getTrackingConfig();
  if (hasMetaPixel(cfg)) injectMetaPixel(cfg.meta_pixel_id.trim());
  if (hasGoogleAds(cfg)) injectGoogleAds(cfg.google_ads_id.trim());
}

// ── Conversion events ───────────────────────────────────────

export interface LeadConversionPayload {
  lead_id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  value?: number;
  currency?: string;
}

export function fireLeadConversion(payload: LeadConversionPayload) {
  if (typeof window === "undefined") return;
  const cfg = getTrackingConfig();

  if (hasMetaPixel(cfg) && window.fbq) {
    window.fbq("track", "Lead", {
      content_name: payload.name ?? undefined,
      content_category: payload.source ?? undefined,
      value: payload.value ?? 0,
      currency: payload.currency ?? "ARS",
    }, { eventID: payload.lead_id });
  }

  if (hasGoogleAds(cfg) && window.gtag) {
    const label = cfg.google_ads_lead_label.trim();
    if (label) {
      window.gtag("event", "conversion", {
        send_to: `${cfg.google_ads_id.trim()}/${label}`,
        value: payload.value ?? 0,
        currency: payload.currency ?? "ARS",
        transaction_id: payload.lead_id,
      });
    } else {
      window.gtag("event", "generate_lead", {
        value: payload.value ?? 0,
        currency: payload.currency ?? "ARS",
        transaction_id: payload.lead_id,
      });
    }
  }
}
