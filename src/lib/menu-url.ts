// Set to this project's published guest menu (".../menu") once it is published; null hides the QR until then.
export const publishedMenuUrl: string | null = null;

export function guestMenuUrl(origin: string): string | null {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (url.protocol !== "https:" || host === "localhost" || host === "127.0.0.1" || host.startsWith("id-preview--") || host.startsWith("preview--") || host.endsWith(".lovableproject.com")) return null;
    return `${url.origin}/menu`;
  } catch {
    return null;
  }
}

export function resolvedGuestMenuUrl(origin: string): string | null {
  return guestMenuUrl(origin) ?? publishedMenuUrl;
}