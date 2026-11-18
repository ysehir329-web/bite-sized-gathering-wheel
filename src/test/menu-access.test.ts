import { beforeEach, describe, expect, it, vi } from "vitest";
import { guestMenuUrl, resolvedGuestMenuUrl } from "@/lib/menu-url";

const database = vi.hoisted(() => ({
  categories: [{ id: "coffee", name: "Kahve", position: 1 }],
  items: [
    { id: "visible", name: "Espresso", available: true, price: 65, position: 1 },
    { id: "hidden", name: "Gizli kahve", available: false, price: 90, position: 2 },
  ],
  writes: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerOnlyFn: (handler: unknown) => handler,
  createMiddleware: () => ({ server: (handler: unknown) => handler }),
  createServerFn: () => {
    let validate = (data: unknown) => data;
    const builder = {
      middleware: () => builder,
      inputValidator: (validator: typeof validate) => { validate = validator; return builder; },
      handler: (handler: (input: { data: unknown; context: unknown }) => unknown) => async (input?: { data: unknown }) => {
        const { createClient } = await import("@supabase/supabase-js");
        return handler({ data: validate(input?.data), context: { db: (createClient as unknown as () => unknown)() } });
      },
    };
    return builder;
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      let availableOnly = false;
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => { if (column === "available" && value === true) availableOnly = true; return query; },
        order: async () => ({ data: table === "menu_categories" ? database.categories : database.items.filter((item) => !availableOnly || item.available), error: null }),
        insert: (values: unknown) => { database.writes(table, "insert", values); return query; },
        update: (values: unknown) => { database.writes(table, "update", values); return query; },
        delete: () => { database.writes(table, "delete"); return query; },
        single: async () => ({ data: { id: "saved" }, error: null }),
      };
      return query;
    },
  }),
}));

import { getDashboard, getMenu, saveCategory, saveItem, deleteEntry, sendComment } from "@/lib/menu.functions";

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://database.example.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  database.writes.mockClear();
});

describe("Passwordless menu access", () => {
  it("loads management without an email, password, or authenticated context", async () => {
    const result = await getDashboard();
    expect(result.categories[0]?.id).toBe("coffee");
    expect(result.items.map((item) => item.id)).toEqual(["visible", "hidden"]);
  });

  it("saves a menu item without credentials", async () => {
    const item = { name: "Espresso", category_id: "coffee", description: "", price: 65, old_price: null, image: "espresso", available: true, position: 1 };
    await expect(saveItem({ data: item })).resolves.toEqual({ id: "saved" });
    expect(database.writes).toHaveBeenCalledWith("menu_items", "insert", item);
  });

  it("saves a category without credentials", async () => {
    await expect(saveCategory({ data: { name: "Kahve", position: 1 } })).resolves.toEqual({ id: "saved" });
    expect(database.writes).toHaveBeenCalledWith("menu_categories", "insert", { name: "Kahve", position: 1 });
  });

  it("deletes a menu entry without credentials", async () => {
    await expect(deleteEntry({ data: { id: "visible", kind: "item" } })).resolves.toEqual({ ok: true });
    expect(database.writes).toHaveBeenCalledWith("menu_items", "delete");
  });

  it("opens the guest menu without credentials and excludes hidden items", async () => {
    const result = await getMenu();
    expect(result.items.map((item) => item.id)).toEqual(["visible"]);
  });

  it("targets the public menu page rather than management or sign-in", () => {
    expect(guestMenuUrl("https://coffee.example.com/dashboard")).toBe("https://coffee.example.com/menu");
  });

  it("does not give guests an editor preview QR that might require sign-in", () => {
    expect(guestMenuUrl("https://id-preview--example.lovable.app")).toBeNull();
    expect(guestMenuUrl("http://localhost:8080")).toBeNull();
  });

  it("shows no QR in the editor until this project's own menu is published", () => {
    expect(resolvedGuestMenuUrl("https://id-preview--example.lovable.app")).toBeNull();
    expect(resolvedGuestMenuUrl("http://localhost:8080")).toBeNull();
  });

  it("stores guest comments as unread for the management panel", async () => {
    await expect(sendComment({ data: { author_name: "Ayşe", message: "Harika kahve" } })).resolves.toEqual({ ok: true });
    expect(database.writes).toHaveBeenCalledWith("guest_comments", "insert", { author_name: "Ayşe", message: "Harika kahve", is_read: false });
  });

  it("never returns guest comments to the public menu", async () => {
    const result = await getMenu();
    expect(Object.keys(result).sort()).toEqual(["categories", "items"]);
  });
});
