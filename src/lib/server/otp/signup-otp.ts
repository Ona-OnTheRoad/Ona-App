import "server-only";
import { createHash } from "node:crypto";
import { findPhoneOwners } from "@/lib/server/otp/phone-owners";
import type { createServiceSupabase } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceSupabase>;

/** Codes live this long. */
export const SIGNUP_OTP_TTL_SEC = 600;
/** Minimum gap between two codes to the same number (drives the client's resend timer). */
export const SIGNUP_OTP_RESEND_SEC = 30;
/** Wrong guesses allowed per code. */
export const SIGNUP_OTP_MAX_ATTEMPTS = 5;

/**
 * phone_otps.phone value for signup codes. The prefix keeps them in a different
 * namespace from login codes (plain "+234..."), so a signup code can never be
 * used to sign in and a login code can never mint a signup proof.
 */
export function signupOtpKey(phone: string): string {
  return `signup:${phone}`;
}

export function hashSignupCode(phone: string, code: string): string {
  return createHash("sha256")
    .update(
      `${signupOtpKey(phone)}:${code}:${process.env.OTP_PROOF_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
    )
    .digest("hex");
}

/**
 * Does any account already use this number? Same rule and same lookup as
 * account creation (last 10 digits, searched across all profiles), so a number
 * that passes here can never be rejected as a duplicate a moment later.
 */
export async function isPhoneInUse(
  sb: Db,
  phone: string,
): Promise<{ inUse: boolean } | { error: string }> {
  const found = await findPhoneOwners(sb, phone);
  if ("error" in found) return { error: found.error };
  return { inUse: found.owners.length > 0 };
}
