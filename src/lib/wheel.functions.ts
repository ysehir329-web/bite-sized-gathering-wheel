import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { managementDb } from "./admin-middleware";
import { wheelSchema, wheelDay, type Prize } from "./wheel-schema";
import { claimStatus, isClaimCode, normalizeClaimCode, type ClaimStatus } from "./wheel-claim";

const codeInput = (input: unknown) => ({ code: normalizeClaimCode(z.object({ code: z.string().max(20) }).parse(input).code) });

// Wheel settings, daily counts and prize codes are locked in the database; only these functions use them.
export const getWheelAdmin = createServerFn({ method: "GET" }).middleware([managementDb]).handler(async ({ context }) => {
  const db = context.db;
  const [settings, wins, claims] = await Promise.all([
    db.from("wheel_settings").select("*").eq("id", 1).single(),
    db.from("wheel_wins").select("prize, count").eq("day", wheelDay()),
    db.from("wheel_claims").select("code, prize, created_at").is("redeemed_at", null).gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(50),
  ]);
  if (settings.error || wins.error || claims.error) throw new Error("Çark ayarları yüklenemedi.");
  const s = settings.data;
  return {
    title: s.title, subtitle: s.subtitle, max_spins: s.max_spins,
    prizes: (s.prizes ?? []) as unknown as Prize[],
    wins: Object.fromEntries((wins.data ?? []).map((w) => [w.prize, w.count])) as Record<string, number>,
    claims: claims.data ?? [],
  };
});

export const saveWheel = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator((input) => wheelSchema.parse(input)).handler(async ({ data, context }) => {
  const result = await context.db.from("wheel_settings")
    .update({ ...data, prizes: data.prizes, updated_at: new Date().toISOString() }).eq("id", 1).select("id").single();
  if (result.error) throw new Error("Çark ayarları kaydedilemedi.");
  return { ok: true };
});

export const resetWheelToday = createServerFn({ method: "POST" }).middleware([managementDb]).handler(async ({ context }) => {
  const result = await context.db.from("wheel_wins").delete().eq("day", wheelDay());
  if (result.error) throw new Error("Bugünkü sayılar sıfırlanamadı.");
  return { ok: true };
});

export type ClaimCheck = { found: false } | { found: true; code: string; prize: string; status: ClaimStatus };

export const checkClaim = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator(codeInput).handler(async ({ data, context }): Promise<ClaimCheck> => {
  if (!isClaimCode(data.code)) return { found: false };
  const { data: claim, error } = await context.db.from("wheel_claims").select("code, prize, expires_at, redeemed_at").eq("code", data.code).maybeSingle();
  if (error) throw new Error("Kod kontrol edilemedi.");
  if (!claim) return { found: false };
  return { found: true, code: claim.code, prize: claim.prize, status: claimStatus(claim) };
});

// One atomic update: a code can be marked used only once, and only before it expires.
export const redeemClaim = createServerFn({ method: "POST" }).middleware([managementDb]).inputValidator(codeInput).handler(async ({ data, context }) => {
  if (!isClaimCode(data.code)) return { ok: false as const };
  const now = new Date().toISOString();
  const { data: claim, error } = await context.db.from("wheel_claims").update({ redeemed_at: now })
    .eq("code", data.code).is("redeemed_at", null).gt("expires_at", now).select("code").maybeSingle();
  if (error) throw new Error("Kod işaretlenemedi.");
  return { ok: !!claim };
});
