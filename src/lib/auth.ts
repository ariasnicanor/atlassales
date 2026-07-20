// Demo-only password helpers. NOT real security.
// En producción esto se reemplaza por Supabase Auth (Lovable Cloud).

export const DEMO_PASSWORD = "demo1234";
// SHA-256("demo1234") precomputado para que el seed sea sync.
export const DEMO_PASSWORD_HASH =
  "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d";

export async function hashPassword(pwd: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback (no debería usarse en el browser moderno).
  let h = 0;
  for (let i = 0; i < pwd.length; i++) h = (h * 31 + pwd.charCodeAt(i)) | 0;
  return String(h);
}
