// Stub Supabase client — la app corre en modo mock por defecto.
// Para conectar Supabase real, instalá @supabase/supabase-js y restaurá
// el `createClient` original.
export const isSupabaseConfigured = false;
export const supabase: unknown = null;
export const DATA_MODE: "supabase" | "mock" = "mock";
