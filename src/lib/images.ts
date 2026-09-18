/**
 * Utilidades para trabajar con fotos de productos alojadas afuera
 * (Google Drive, Dropbox, etc.). No guardamos archivos: solo links.
 */

const DRIVE_FILE = /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/;
const DRIVE_OPEN = /drive\.google\.com\/(?:open|uc)\?[^\s]*id=([A-Za-z0-9_-]+)/;
const DRIVE_FOLDER = /drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]+)/;
const DROPBOX = /dropbox\.com\//;

/** Indica si el link es una carpeta de Drive (no se puede mostrar como imagen). */
export function isDriveFolder(url: string): boolean {
  return DRIVE_FOLDER.test(url);
}

/**
 * Convierte links de "vista" en links directos a la imagen.
 * Google Drive → thumbnail de alta resolución (rápido y liviano).
 */
export function normalizeImageUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";

  const id = url.match(DRIVE_FILE)?.[1] ?? url.match(DRIVE_OPEN)?.[1];
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;

  if (DROPBOX.test(url)) return url.replace(/\?dl=0$/, "?raw=1");

  return url;
}

/** Parsea un pegado de varios links (uno por línea, coma o espacio). */
export function parseImageList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,\s]+/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s) && !isDriveFolder(s))
        .map(normalizeImageUrl),
    ),
  );
}

/** Devuelve las carpetas de Drive pegadas, para avisar que no se pueden usar. */
export function findDriveFolders(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter(isDriveFolder);
}
