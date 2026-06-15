import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// Supabase client (opcional)
// La app funciona con datos demo locales si no hay credenciales.
// Cuando completes VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
// (y VITE_USE_MOCK_DATA != "true"), `supabase` queda disponible
// y podés migrar los hooks de datos para leer/escribir real.
// ─────────────────────────────────────────────────────────────

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const forceMock = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const isSupabaseConfigured = Boolean(url && anonKey) && !forceMock;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/**
 * Modo de datos activo. La UI muestra un badge "Demo" cuando es mock,
 * así un cliente potencial entiende que está viendo datos de ejemplo.
 */
export const DATA_MODE: "supabase" | "mock" = isSupabaseConfigured
  ? "supabase"
  : "mock";
