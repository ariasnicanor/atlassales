// Punto de entrada de la capa de WhatsApp.
// La UI importa SOLO desde acá: `import { useWhatsApp } from "@/lib/whatsapp"`.

import { useEffect, useMemo, useRef, useState } from "react";
import type { WaProviderId, WaProviderOptions, WaProviderStatus, WhatsAppProvider } from "./types";
import { MockWhatsAppProvider } from "./mock-provider";
import { OpenWaProvider } from "./openwa-provider";
import { CloudApiProvider } from "./cloud-api-provider";

export * from "./types";

const PROVIDER_OVERRIDE_KEY = "atlas-sales-os:wa-provider";

/**
 * Resuelve qué proveedor usar. Prioridad:
 *   1. override manual en localStorage (útil para probar en el demo)
 *   2. variable de entorno VITE_WA_PROVIDER
 *   3. default "mock"
 */
export function resolveProviderId(): WaProviderId {
  if (typeof window !== "undefined") {
    try {
      const override = window.localStorage.getItem(PROVIDER_OVERRIDE_KEY);
      if (override === "mock" || override === "openwa" || override === "cloud-api") return override;
    } catch {
      /* ignore */
    }
  }
  const env = (import.meta.env.VITE_WA_PROVIDER as string | undefined)?.trim();
  if (env === "openwa" || env === "cloud-api" || env === "mock") return env;
  return "mock";
}

export function setProviderOverride(id: WaProviderId | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(PROVIDER_OVERRIDE_KEY, id);
    else window.localStorage.removeItem(PROVIDER_OVERRIDE_KEY);
  } catch {
    /* ignore */
  }
}

export function createWhatsAppProvider(
  id: WaProviderId,
  opts: WaProviderOptions = {},
): WhatsAppProvider {
  switch (id) {
    case "openwa":
      return new OpenWaProvider({
        baseUrl:
          opts.openWaUrl ?? (import.meta.env.VITE_OPENWA_URL as string) ?? "http://localhost:3100",
        token: opts.openWaToken ?? (import.meta.env.VITE_OPENWA_TOKEN as string | undefined),
        pollIntervalMs: opts.pollIntervalMs,
      });
    case "cloud-api":
      return new CloudApiProvider();
    case "mock":
    default:
      return new MockWhatsAppProvider(opts.seed);
  }
}

export interface UseWhatsAppResult {
  provider: WhatsAppProvider | null;
  status: WaProviderStatus | null;
  providerId: WaProviderId;
}

/**
 * Hook que instancia el proveedor resuelto, lo inicializa y expone su estado.
 * Se recrea solo si cambia el `providerId`. Las semillas del mock se pasan por
 * `opts.seed` y se leen una única vez (el mock persiste su propio estado).
 */
export function useWhatsApp(opts: WaProviderOptions = {}): UseWhatsAppResult {
  const providerId = useMemo(() => resolveProviderId(), []);
  const [status, setStatus] = useState<WaProviderStatus | null>(null);
  const providerRef = useRef<WhatsAppProvider | null>(null);
  // Congelar seed inicial: el mock la consume una sola vez.
  const seedRef = useRef(opts.seed);

  const [provider] = useState<WhatsAppProvider>(() =>
    createWhatsAppProvider(providerId, { ...opts, seed: seedRef.current }),
  );
  providerRef.current = provider;

  useEffect(() => {
    let alive = true;
    const unsub = provider.onStatus((s) => {
      if (alive) setStatus(s);
    });
    void provider.init();
    void provider.getStatus().then((s) => {
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
      unsub();
      provider.dispose();
    };
  }, [provider]);

  return { provider, status, providerId };
}
