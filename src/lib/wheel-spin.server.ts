import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DEVICE_COOKIE, isDeviceId, makeClaimCode, newDeviceId } from "./wheel-claim";

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type SpinResult = { status: "ok" | "device_limit" | "ip_limit" | "unavailable"; index?: number; code?: string | null; used?: number };

function readCookie(header: string | null, name: string): string | undefined {
  for (const part of (header ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

/** One spin: the device cookie and the database decide, never the browser's counter. */
export async function handleWheelSpin(request: Request): Promise<Response> {
  const existing = readCookie(request.headers.get("cookie"), DEVICE_COOKIE);
  const device = isDeviceId(existing) ? existing : newDeviceId();
  const ip = request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-nf-client-connection-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const ipHash = await sha256(ip);
  const headers = new Headers({
    "cache-control": "no-store",
    "set-cookie": `${DEVICE_COOKIE}=${device}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`,
  });

  let result: SpinResult | null = null;
  for (let attempt = 0; attempt < 3 && !result; attempt++) {
    const { data, error } = await supabaseAdmin.rpc("spin_wheel_guest", { p_device: device, p_ip: ipHash, p_code: makeClaimCode() });
    if (!error) result = data as unknown as SpinResult;
    else if (error.code !== "23505") break; // retry only when the random code already exists
  }
  if (!result || result.status === "unavailable") return Response.json({ error: "unavailable" }, { status: 503, headers });
  if (result.status === "device_limit" || result.status === "ip_limit") return Response.json({ error: result.status, used: result.used ?? 0 }, { status: 429, headers });
  return Response.json({ index: result.index, code: result.code ?? null, used: result.used ?? 0 }, { headers });
}
