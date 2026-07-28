import { useEffect } from "react";
import { initTrackingPixels, captureUtmFromLocation } from "@/lib/tracking";

/**
 * Inicializa pixeles de Meta y Google Ads, y captura UTMs de la URL.
 * Se re-inicializa cuando el Admin cambia los IDs en Settings.
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    captureUtmFromLocation();
    initTrackingPixels();
    const onChange = () => initTrackingPixels();
    window.addEventListener("tracking:changed", onChange);
    return () => window.removeEventListener("tracking:changed", onChange);
  }, []);
  return <>{children}</>;
}
