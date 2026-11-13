import "server-only";
import { createHash } from "node:crypto";
import { phoneOrFilter, phonesMatch } from "@/lib/server/phone-match";
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
 * Does any account already use this number? Exact normalized match (the same
 * lookup the login routes use), never a "first 500 rows" scan.
 */
export async function isPhoneInUse(
  sb: Db,
  phone: string,
): Promise<{ inUse: boolean } | { error: string }> {
  const { data, error } = await sb
    .from("profiles")
    .select("id, phone")
    .or(phoneOrFilter(phone))
    .limit(25);
  if (error) return { error: error.message };
  const rows = (data || []) as Array<{ id: string; phone: string | null }>;
  return { inUse: rows.some((r) => phonesMatch(r.phone, phone)) };
}
