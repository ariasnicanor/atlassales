/** Build a wa.me link from a phone number and optional prefilled message. */
export function whatsappLink(phone?: string | null, message?: string) {
  const clean = (phone ?? "").replace(/[^\d]/g, "");
  const base = `https://wa.me/${clean}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(phone?: string | null) {
  return `tel:${(phone ?? "").replace(/\s/g, "")}`;
}

export function mailLink(email?: string | null, subject?: string) {
  const base = `mailto:${email ?? ""}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

/** Copy text to clipboard, returns success boolean. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Replace {{token}} placeholders in a template body. */
export function fillTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}
