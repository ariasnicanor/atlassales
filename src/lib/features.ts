import type { User, UserRole } from "@/types";
import type { Action, Resource } from "@/lib/permissions";
import { can } from "@/lib/permissions";

// ─────────────────────────────────────────────────────────────
// Catálogo de funciones "togglables" por usuario.
// Cada feature tiene un default por rol (derivado de ROLE_MATRIX o
// hardcodeado) y puede ser forzada (habilitada/bloqueada) por el Admin
// vía user.feature_overrides[key].
// Para agregar una nueva feature: sumar una entrada al array de abajo y
// gatearla en la UI con hasFeature(user, "key").
// ─────────────────────────────────────────────────────────────

export interface FeatureDef {
  key: string;
  label: string;
  description: string;
  /** Roles a los que aplica el toggle (para no mostrar cosas absurdas). */
  appliesTo: UserRole[];
  /** Permiso base opcional para calcular el default a partir de ROLE_MATRIX. */
  base?: { action: Action; resource: Resource };
  /** Override manual de defaults por rol (gana sobre `base`). */
  defaults?: Partial<Record<UserRole, boolean>>;
}

export const FEATURES: FeatureDef[] = [
  {
    key: "import_leads",
    label: "Importar leads",
    description: "Ver y usar la carga masiva de leads por Excel.",
    appliesTo: ["admin", "supervisor", "vendedor", "recepcion"],
    defaults: { admin: true, supervisor: true, vendedor: false, recepcion: false },
  },
  {
    key: "view_reports",
    label: "Ver reportes",
    description: "Acceder al módulo de reportes y métricas del equipo.",
    appliesTo: ["admin", "supervisor", "vendedor", "recepcion"],
    base: { action: "view", resource: "reports" },
  },
  {
    key: "whatsapp",
    label: "Acceder a WhatsApp",
    description: "Ver la bandeja simulada de WhatsApp y gestionar leads desde el chat.",
    appliesTo: ["admin", "supervisor", "vendedor", "recepcion"],
    defaults: { admin: true, supervisor: true, vendedor: true, recepcion: true },
  },
  {
    key: "pixel_config",
    label: "Configurar campañas / Pixel",
    description: "Editar IDs de Meta Pixel y Google Ads en Configuración.",
    appliesTo: ["admin", "supervisor"],
    defaults: { admin: true, supervisor: false },
  },
  {
    key: "export_data",
    label: "Exportar datos",
    description: "Descargar CSV de leads, reportes y auditoría.",
    appliesTo: ["admin", "supervisor", "vendedor", "recepcion"],
    base: { action: "export", resource: "leads" },
  },
  {
    key: "view_audit",
    label: "Ver auditoría",
    description: "Acceder al historial de acciones del sistema.",
    appliesTo: ["admin", "supervisor"],
    base: { action: "view", resource: "audit" },
  },
  {
    key: "integrations",
    label: "Integraciones (Google Calendar)",
    description: "Conectar y sincronizar Google Calendar personal.",
    appliesTo: ["admin", "supervisor", "vendedor", "recepcion"],
    defaults: { admin: true, supervisor: true, vendedor: true, recepcion: false },
  },
];

export function featureDefault(feature: FeatureDef, user: User): boolean {
  const explicit = feature.defaults?.[user.role];
  if (typeof explicit === "boolean") return explicit;
  if (feature.base) return can(user, feature.base.action, feature.base.resource);
  return false;
}

/** Devuelve true si el usuario puede usar `key`. Override manual > default por rol. */
export function hasFeature(user: User | null | undefined, key: string): boolean {
  if (!user) return false;
  const feat = FEATURES.find((f) => f.key === key);
  if (!feat) return true;
  if (!feat.appliesTo.includes(user.role)) {
    // La feature no aplica a este rol → nunca habilitada.
    return false;
  }
  const override = user.feature_overrides?.[key];
  if (typeof override === "boolean") return override;
  return featureDefault(feat, user);
}
