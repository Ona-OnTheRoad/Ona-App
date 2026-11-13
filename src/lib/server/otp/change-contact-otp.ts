import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { emailOtpKey } from "@/lib/auth/demo-otp";
import { canonicalPhone } from "@/lib/server/phone-match";
import type { createServiceSupabase } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceSupabase>;
export type ContactChannel = "phone" | "email";

/** Codes live this long. */
export const CHANGE_CONTACT_TTL_SEC = 600;
/** Minimum gap between two codes to the same new contact. */
export const CHANGE_CONTACT_RESEND_SEC = 30;
/** Wrong guesses allowed per code. */
export const CHANGE_CONTACT_MAX_ATTEMPTS = 5;

/** Canonical form of the new contact: "+2348031234567" or a lower-cased email. Null if invalid. */
export function normalizeContactTarget(channel: ContactChannel, raw: string): string | null {
  const v = String(raw ?? "").trim();
  if (channel === "phone") return canonicalPhone(v);
  const email = v.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

/**
 * phone_otps.phone value for change-contact codes. Bound to the user AND the exact
 * new contact, in its own namespace: a code for one user/contact can never satisfy
 * another, nor a login or signup code ("signup:", plain, "email:").
 */
export function changeContactKey(userId: string, channel: ContactChannel, target: string): string {
  const t = channel === "email" ? emailOtpKey(target) : target;
  return `change:${userId}:${t}`;
}

function secret(): string {
  const s = process.env.OTP_PROOF_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!s) throw new Error("OTP proof secret is not configured");
  return s;
}

/** Can codes be hashed here? Checked before sending a code that could never be verified. */
export function isChangeContactConfigured(): boolean {
  return Boolean(process.env.OTP_PROOF_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function hashChangeContactCode(key: string, code: string): string {
  return createHash("sha256").update(`${key}:${code}:${secret()}`).digest("hex");
}

export type CodeCheck =
  | { ok: true }
  | { ok: false; status: 400 | 401 | 429; code: string; message: string };

/**
 * Verify the latest active code stored under `key` and consume it on success.
 * Wrong guesses are counted and lock the code after CHANGE_CONTACT_MAX_ATTEMPTS.
 * Shared by every "code bound to a user and a purpose" flow (contact change, bank change).
 */
export async function consumeOtpByKey(
  sb: Db,
  input: { key: string; code: string },
): Promise<CodeCheck> {
  const key = input.key;
  const code = String(input.code ?? "").replace(/\D/g, "");
  if (code.length < 4) {
    return { ok: false, status: 400, code: "otp_invalid", message: "Enter the 6-digit code." };
  }
  const { data: rows, error } = await sb
    .from("phone_otps")
    .select("*")
    .eq("phone", key)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    return { ok: false, status: 400, code: "otp_check_failed", message: "Could not check the code. Try again." };
  }
  const otp = rows?.[0] as
    | { id: string; code_hash: string; expires_at: string; attempts?: number }
    | undefined;
  if (!otp) {
    return { ok: false, status: 400, code: "otp_missing", message: "No active code. Tap Resend code." };
  }
  const consume = () =>
    sb.from("phone_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    await consume();
    return { ok: false, status: 400, code: "otp_expired", message: "Code expired. Request a new one." };
  }
  if ((otp.attempts ?? 0) >= CHANGE_CONTACT_MAX_ATTEMPTS) {
    await consume();
    return { ok: false, status: 429, code: "otp_locked", message: "Too many attempts. Request a new code." };
  }
  const a = Buffer.from(hashChangeContactCode(key, code));
  const b = Buffer.from(String(otp.code_hash));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    const failed = (otp.attempts ?? 0) + 1;
    await sb.from("phone_otps").update({ attempts: failed }).eq("id", otp.id);
    return {
      ok: false,
      status: 401,
      code: "otp_invalid",
      message:
        failed >= CHANGE_CONTACT_MAX_ATTEMPTS
          ? "Too many incorrect codes. Request a new code."
          : "Incorrect code. Try again.",
    };
  }
  await consume();
  return { ok: true };
}

/**
 * Verify the latest active code for (user, new contact) and consume it on success.
 */
export async function consumeChangeContactCode(
  sb: Db,
  input: { userId: string; channel: ContactChannel; target: string; code: string },
): Promise<CodeCheck> {
  return consumeOtpByKey(sb, {
    key: changeContactKey(input.userId, input.channel, input.target),
    code: input.code,
  });
}
