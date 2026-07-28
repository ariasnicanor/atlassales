import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useSession } from "@/context/session";
import { can, type Action, type Resource } from "@/lib/permissions";
import { hasFeature } from "@/lib/features";

/**
 * Guard de acceso por ruta. Valida el permiso real (matriz de rol + overrides)
 * en la capa de acceso, no solo ocultando botones: si el usuario entra por URL
 * directa sin permiso, se lo redirige.
 */
export function RequirePermission({
  action = "view",
  resource,
  feature,
  children,
}: {
  action?: Action;
  resource: Resource;
  feature?: string;
  children: ReactNode;
}) {
  const { currentUser } = useSession();
  if (!currentUser) return <Navigate to="/login" replace />;
  const allowed = can(currentUser, action, resource) && (!feature || hasFeature(currentUser, feature));
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
