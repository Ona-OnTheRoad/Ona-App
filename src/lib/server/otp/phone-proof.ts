import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Proof that a phone number received a signup code.
 *
 * Issued by /api/auth/otp/signup/verify, presented to /api/auth/signup. It does
 * NOT log anyone in: it only says "this exact number was verified recently".
 * Signed (HMAC-SHA256), bound to one number, tamper-evident. It must outlive
 * the longest signup wizard (Repair Pro: bank, documents), hence 2 hours.
 */
export const PHONE_PROOF_TTL_MS = 2 * 60 * 60 * 1000;

/** Domain separation: this key signs other things too, so a proof can never double as one. */
const DOMAIN = "ona-signup-phone-proof-v1";

type ProofPayload = { p: string; exp: number; n: string };

function secret(): string {
  const s =
    process.env.OTP_PROOF_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!s) throw new Error("OTP proof secret is not configured");
  return s;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret())
    .update(`${DOMAIN}.${payloadB64}`)
    .digest("base64url");
}

/** Can proofs be signed here? Checked before texting a code that could never become a proof. */
export function isPhoneProofConfigured(): boolean {
  return Boolean(
    process.env.OTP_PROOF_SECRET?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

/** `phone` must already be canonical (+2348031234567). Throws only if no secret is configured. */
export function issuePhoneProof(
  phone: string,
  now: number = Date.now(),
): { proof: string; expiresAt: number } {
  const expiresAt = now + PHONE_PROOF_TTL_MS;
  const payload: ProofPayload = {
    p: phone,
    exp: expiresAt,
    n: randomBytes(8).toString("hex"),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return { proof: `${body}.${sign(body)}`, expiresAt };
}

/** True only for an untampered, unexpired proof issued for exactly this number. Never throws. */
export function verifyPhoneProof(
  token: string | null | undefined,
  phone: string,
  now: number = Date.now(),
): boolean {
  try {
    if (!token || typeof token !== "string" || !phone) return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [body, sig] = parts;
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<ProofPayload>;
    if (typeof payload.exp !== "number" || payload.exp <= now) return false;
    return payload.p === phone;
  } catch {
    return false;
  }
}
