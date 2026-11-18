import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { itemSchema, categorySchema, commentSchema } from "./menu-schema";
import { managementDb } from "./admin-middleware";
import { MENU_PHOTO_BUCKET, MENU_PHOTO_MAX_BYTES, MENU_PHOTO_TYPES, menuPhotoUrl, sniffImage } from "./menu-photo";

export const createMenuClient = createServerOnlyFn((url: string | undefined, key: string | undefined) => {
  if (!key || !url) throw new Error("Menü bağlantısı kurulamadı.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
});

export const getMenu = createServerFn({ method: "GET" }).handler(async () => {
  const client = createMenuClient(process.env['SUPABASE_URL'], process.env['SUPABASE_PUBLISHABLE_KEY']);
  const [categories, items] = await Promise.all([
    client.from("menu_categories").select("*").order("position"),
    client.from("menu_items").select("*").eq("available", true).order("position"),
  ]);
  if (categories.error || items.error) throw new Error("Menü yüklenemedi.");
  return { categories: categories.data ?? [], items: items.data ?? [] };
});

// Management is intentionally public at the owner's request. The publishable
// client can access only the menu tables allowed by their explicit RLS policies.
export const getDashboard = createServerFn({ method: "GET" }).middleware([managementDb]).handler(async ({ context }) => {
  const client = context.db;
  const [categories, items] = await Promise.all([
    client.from("menu_categories").select("*").order("position"),
    client.from("menu_items").select("*").order("position"),
  ]);
  if (categories.error || items.error) throw new Error("Panel yüklenemedi.");
  return { categories: categories.data ?? [], items: items.data ?? [] };
});

export const saveItem = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator((input) => itemSchema.parse(input)).handler(async ({ data, context }) => {
  const client = context.db;
  const { id, ...values } = data;
  const result = id ? await client.from("menu_items").update(values).eq("id", id).select("id").single() : await client.from("menu_items").insert(values).select("id").single();
  if (result.error) throw new Error("Ürün kaydedilemedi.");
  return result.data;
});
export const saveCategory = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator((input) => categorySchema.parse(input)).handler(async ({ data, context }) => {
  const client = context.db;
  const { id, ...values } = data;
  const result = id ? await client.from("menu_categories").update(values).eq("id", id).select("id").single() : await client.from("menu_categories").insert(values).select("id").single();
  if (result.error) throw new Error("Kategori kaydedilemedi.");
  return result.data;
});
export const deleteEntry = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator((input) => z.object({ id: z.string().min(1), kind: z.enum(["item", "category"]) }).parse(input)).handler(async ({ data, context }) => {
  const client = context.db;
  const result = await client.from(data.kind === "item" ? "menu_items" : "menu_categories").delete().eq("id", data.id).select("id").single();
  if (result.error) throw new Error(data.kind === "category" ? "Önce bu kategorideki ürünleri taşıyın veya silin." : "Ürün silinemedi.");
  return { ok: true };
});
export const setItemAvailability = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator((input) => z.object({ id: z.string().min(1), available: z.boolean() }).parse(input)).handler(async ({ data, context }) => {
  const client = context.db;
  const result = await client.from("menu_items").update({ available: data.available }).eq("id", data.id).select("id, available").single();
  if (result.error) throw new Error("Ürün durumu değiştirilemedi.");
  return result.data;
});


// Guest comments go only to the management panel; the guest menu never lists them.
export const sendComment = createServerFn({ method: "POST" }).inputValidator((input) => commentSchema.parse(input)).handler(async ({ data }) => {
  const client = createMenuClient(process.env['SUPABASE_URL'], process.env['SUPABASE_PUBLISHABLE_KEY']);
  const result = await client.from("guest_comments").insert({ ...data, is_read: false });
  if (result.error) throw new Error("Yorum gönderilemedi.");
  return { ok: true };
});
// Comments are locked in the database; only management functions read or change them.
export const getComments = createServerFn({ method: "GET" }).middleware([managementDb]).handler(async ({ context }) => {
  const result = await context.db.from("guest_comments").select("*").order("created_at", { ascending: false }).limit(500);
  if (result.error) throw new Error("Yorumlar yüklenemedi.");
  return result.data ?? [];
});
export const markComment = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator((input) => z.object({ id: z.string().uuid(), is_read: z.boolean() }).parse(input)).handler(async ({ data, context }) => {
  const result = await context.db.from("guest_comments").update({ is_read: data.is_read }).eq("id", data.id).select("id").single();
  if (result.error) throw new Error("Yorum güncellenemedi.");
  return { ok: true };
});
export const deleteComment = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const result = await context.db.from("guest_comments").delete().eq("id", data.id).select("id").single();
  if (result.error) throw new Error("Yorum silinemedi.");
  return { ok: true };
});

// Storage has no public write rule: photos are checked here and stored under a server-made name.
export const uploadMenuPhoto = createServerFn({ method: "POST" }).middleware([managementDb])
  .inputValidator((input) => {
    const file = input instanceof FormData ? input.get("file") : null;
    if (!(file instanceof File)) throw new Error("Fotoğraf bulunamadı.");
    return { file };
  })
  .handler(async ({ data, context }) => {
    const { file } = data;
    if (!MENU_PHOTO_TYPES.includes(file.type)) throw new Error("Yalnızca JPEG, PNG veya WebP fotoğraf yüklenebilir.");
    if (file.size > MENU_PHOTO_MAX_BYTES) throw new Error("Fotoğraf en fazla 2 MB olabilir.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (bytes.byteLength > MENU_PHOTO_MAX_BYTES || !kind || kind !== file.type) throw new Error("Dosya geçerli bir fotoğraf değil.");
    const name = `${crypto.randomUUID()}.jpg`;
    const { error } = await context.db.storage.from(MENU_PHOTO_BUCKET).upload(name, bytes, { contentType: kind, cacheControl: "31536000" });
    if (error) throw new Error("Fotoğraf yüklenemedi.");
    return { url: menuPhotoUrl(name) };
  });
