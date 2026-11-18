import { describe, expect, it } from "vitest";
import { prizeMode, limitForMode, wheelSchema, wheelDay } from "@/lib/wheel-schema";

const prize = (t: string, limit: number | null) => ({ t, e: "🎁", c: "#8d5524", limit });

describe("lucky wheel rules", () => {
  it("no limit means anyone can win", () => expect(prizeMode(null)).toBe("u"));
  it("a limit of 0 means shown on the wheel but nobody wins", () => expect(prizeMode(0)).toBe("z"));
  it("a positive limit is a daily cap", () => expect(prizeMode(3)).toBe("l"));
  it("switching to daily limit keeps at least 1 winner", () => expect(limitForMode("l", 0)).toBe(1));
  it("prize names must be different", () => {
    expect(wheelSchema.safeParse({ title: "", subtitle: "", max_spins: 2, prizes: [prize("Free Tea", 1), prize("free tea", null)] }).success).toBe(false);
  });
  it("the wheel needs at least 2 prizes", () => {
    expect(wheelSchema.safeParse({ title: "", subtitle: "", max_spins: 2, prizes: [prize("Free Tea", 1)] }).success).toBe(false);
  });
  it("the day rolls over at midnight café time (UTC+3)", () => {
    expect(wheelDay(new Date("2026-11-16T20:59:00Z"))).toBe("2026-11-16");
    expect(wheelDay(new Date("2026-11-16T21:01:00Z"))).toBe("2026-11-17");
  });
});

import { guestWheelSchema } from "@/lib/wheel-schema";
test("guest wheel accepts public settings without daily limits", () => {
  const ok = guestWheelSchema.safeParse({ title: "Çark", subtitle: "", max_spins: 2, prizes: [{ t: "Kahve", e: "☕", c: "#8d5524", x: false }, { t: "Yok", e: "🙂", c: "#2f9e44", x: true }] });
  expect(ok.success).toBe(true);
});
