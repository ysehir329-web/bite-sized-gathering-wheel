import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimStatus, isClaimCode, makeClaimCode, normalizeClaimCode } from "@/lib/wheel-claim";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));

import { handleWheelSpin } from "@/lib/wheel-spin.server";

describe("prize codes", () => {
  it("are 6 characters without the look-alikes 0, O, 1 and I", () => {
    for (let i = 0; i < 200; i++) {
      const code = makeClaimCode();
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
      expect(code).not.toMatch(/[01OI]/);
      expect(isClaimCode(code)).toBe(true);
    }
    expect(normalizeClaimCode(" abc 234 ")).toBe("ABC234");
  });

  it("are valid until the end of the day and can be used only once", () => {
    const now = new Date("2026-11-18T10:00:00Z");
    expect(claimStatus({ redeemed_at: null, expires_at: "2026-11-18T21:00:00Z" }, now)).toBe("valid");
    expect(claimStatus({ redeemed_at: "2026-11-18T09:00:00Z", expires_at: "2026-11-18T21:00:00Z" }, now)).toBe("used");
    expect(claimStatus({ redeemed_at: null, expires_at: "2026-11-18T09:00:00Z" }, now)).toBe("expired");
  });
});

describe("spin limit", () => {
  beforeEach(() => rpc.mockReset());

  it.each([
    ["cf-connecting-ip", { "cf-connecting-ip": "192.0.2.10", "x-nf-client-connection-ip": "192.0.2.20", "x-real-ip": "192.0.2.30", "x-forwarded-for": "192.0.2.40" }, "192.0.2.10"],
    ["x-nf-client-connection-ip", { "x-nf-client-connection-ip": "192.0.2.20", "x-real-ip": "192.0.2.30", "x-forwarded-for": "192.0.2.40" }, "192.0.2.20"],
    ["x-real-ip", { "x-real-ip": "192.0.2.30", "x-forwarded-for": "192.0.2.40" }, "192.0.2.30"],
    ["x-forwarded-for", { "x-forwarded-for": "192.0.2.40, 192.0.2.50" }, "192.0.2.40"],
  ] as const)("applies the IP limit using %s in priority order", async (_, headers, ip) => {
    rpc.mockResolvedValue({ data: { status: "ip_limit", used: 1 }, error: null });
    const response = await handleWheelSpin(new Request("https://cafe.test/api/public/wheel-spin", { method: "POST", headers: { ...headers } }));
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    expect(rpc).toHaveBeenCalledWith("spin_wheel_guest", expect.objectContaining({ p_ip: hash }));
    expect(response.status).toBe(429);
  });

  it("refuses a spin with 429 once the device used its daily spins", async () => {
    rpc.mockResolvedValue({ data: { status: "device_limit", used: 2 }, error: null });
    const response = await handleWheelSpin(new Request("https://cafe.test/api/public/wheel-spin", { method: "POST" }));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "device_limit", used: 2 });
  });

  it("keeps the same device cookie and returns the prize code", async () => {
    const device = "a".repeat(64);
    rpc.mockResolvedValue({ data: { status: "ok", index: 1, code: "ABC234", used: 1 }, error: null });
    const response = await handleWheelSpin(new Request("https://cafe.test/api/public/wheel-spin", { method: "POST", headers: { cookie: `wheel_device=${device}` } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ index: 1, code: "ABC234", used: 1 });
    expect(rpc.mock.calls[0]?.[1]).toMatchObject({ p_device: device });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
