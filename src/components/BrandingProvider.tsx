import { useEffect, type ReactNode } from "react";
import { useData } from "@/data/store";
import { hexToHslTriple, readableForeground } from "@/lib/color";

/**
 * Aplica los colores de la empresa (branding) a las variables CSS en runtime.
 * Esto permite vender el sistema a distintas empresas y verlo personalizado.
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const { company } = useData();

  useEffect(() => {
    const root = document.documentElement;
    const primary = hexToHslTriple(company.primary_color);
    const secondary = hexToHslTriple(company.secondary_color);

    root.style.setProperty("--brand", primary);
    root.style.setProperty("--brand-foreground", readableForeground(company.primary_color));
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", readableForeground(company.primary_color));
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--accent2", secondary);
    root.style.setProperty("--accent2-foreground", readableForeground(company.secondary_color));
  }, [company.primary_color, company.secondary_color]);

  return <>{children}</>;
}
