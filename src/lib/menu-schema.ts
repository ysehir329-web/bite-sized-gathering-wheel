import { z } from "zod";

export const itemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  category_id: z.string().min(1),
  description: z.string().trim().max(500),
  price: z.number().finite().nonnegative(),
  old_price: z.number().finite().nonnegative().nullable(),
  image: z.string().min(1, "Lütfen ürün fotoğrafı yükleyin.").max(4000000),
  available: z.boolean(),
  position: z.number().int().nonnegative(),
}).refine((item) => item.old_price === null || item.old_price > item.price, {
  message: "Eski fiyat satış fiyatından yüksek olmalı.", path: ["old_price"],
});
export const categorySchema = z.object({ id: z.string().optional(), name: z.string().trim().min(1).max(80), position: z.number().int().nonnegative() });
export const commentSchema = z.object({
  author_name: z.string().trim().max(60),
  message: z.string().trim().min(1, "Lütfen yorumunuzu yazın.").max(1000, "Yorum en fazla 1000 karakter olabilir."),
});
