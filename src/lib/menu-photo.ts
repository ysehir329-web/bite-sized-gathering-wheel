export const MENU_PHOTO_BUCKET = "menu-photos";
/** Largest stored photo (checked in the browser after shrinking, and again on the server). */
export const MENU_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
/** Largest original the browser will try to shrink. */
export const MENU_PHOTO_SOURCE_MAX_BYTES = 15 * 1024 * 1024;
export const MENU_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const NAME = /^[0-9a-f-]{36}\.jpg$/;

export function isMenuPhotoName(name: string): boolean {
  return NAME.test(name);
}

/** Reads the file's first bytes: the declared type alone can be faked. */
export function sniffImage(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  const at = (offset: number, sig: number[]) => sig.every((b, i) => bytes[offset + i] === b);
  if (at(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  return null;
}

export function menuPhotoUrl(name: string): string {
  return `/api/public/menu-photo/${name}`;
}

/** Shrinks a photo in the browser so the menu stays fast on phones. */
export async function compressMenuPhoto(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Fotoğraf işlenemedi.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Fotoğraf işlenemedi."))), "image/jpeg", quality),
  );
}
