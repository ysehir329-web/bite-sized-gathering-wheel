import { describe, expect, it } from "vitest";
import { itemSchema, commentSchema } from "@/lib/menu-schema";
const item = { name: "Espresso", category_id: "sicak", description: "", price: 65, old_price: 80, image: "espresso", available: true, position: 1 };
describe("Menu management rules", () => {
  it("preserves entered prices", () => { expect(itemSchema.parse(item).price).toBe(65); });
  it("rejects negative prices", () => { expect(itemSchema.safeParse({ ...item, price: -1 }).success).toBe(false); });
  it("rejects an old price below the selling price", () => { expect(itemSchema.safeParse({ ...item, old_price: 60 }).success).toBe(false); });
});
describe("New product photo", () => {
  it("requires an uploaded photo", () => {
    const result = itemSchema.safeParse({ ...item, image: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Lütfen ürün fotoğrafı yükleyin.");
  });
});
describe("Guest comments", () => {
  it("requires a written comment", () => { expect(commentSchema.safeParse({ author_name: "", message: "   " }).success).toBe(false); });
  it("allows sending without a name", () => {
    expect(commentSchema.parse({ author_name: "", message: "Teşekkürler" })).toEqual({ author_name: "", message: "Teşekkürler" });
  });
});
