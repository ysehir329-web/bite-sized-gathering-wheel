/** Prize code alphabet: no 0/O or 1/I so codes are easy to read aloud. 32 symbols. */
export const CLAIM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CLAIM_CODE = /^[A-HJ-NP-Z2-9]{6}$/;
export const DEVICE_COOKIE = "wheel_device";
const DEVICE_ID = /^[0-9a-f]{64}$/;

export function makeClaimCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => CLAIM_ALPHABET[b & 31]).join("");
}
export function normalizeClaimCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
export function isClaimCode(code: string): boolean {
  return CLAIM_CODE.test(code);
}
export type ClaimStatus = "valid" | "used" | "expired";
export function claimStatus(claim: { redeemed_at: string | null; expires_at: string }, now = new Date()): ClaimStatus {
  if (claim.redeemed_at) return "used";
  return new Date(claim.expires_at).getTime() <= now.getTime() ? "expired" : "valid";
}
export function newDeviceId(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function isDeviceId(value: string | undefined): value is string {
  return !!value && DEVICE_ID.test(value);
}
