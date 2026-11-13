/**
 * Demo / fallback OTP until real SMS (Africa's Talking) and email delivery are live.
 * Accepted for every user on phone and email OTP login & verify server AND client.
 *
 * Env (any true → demo allowed):
 * - Non-production NODE_ENV (local `next dev`)
 * - OTP_DEMO_MODE=true → server / API routes
 * - NEXT_PUBLIC_OTP_DEMO_MODE=true → browser too (artisan onboarding, client helpers)
 *
 * Both server and public flags should be set on Vercel when demo OTP is needed live.
 */
export const DEMO_OTP_CODE = "336699";

export function isDemoOtp(code: string | null | undefined): boolean {
  return String(code || "").replace(/\D/g, "") === DEMO_OTP_CODE;
}

export type OtpChannel = "phone" | "email";

function parseFlag(v: string | undefined): boolean | undefined {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1" || s.includes("sensitive")) return true;
  if (s === "false" || s === "0") return false;
  return undefined;
}

/**
 * Original, fail-open rule: demo codes are accepted in production unless
 * explicitly switched off. Still used for the EMAIL channel (no email delivery
 * yet) and by admin tooling that borrowed this flag. Do not use for phone.
 */
export function legacyDemoOtpAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const rawOtp = String(process.env.OTP_DEMO_MODE ?? "").trim().toLowerCase();
  const rawPub = String(
    process.env.NEXT_PUBLIC_OTP_DEMO_MODE ?? "",
  ).trim().toLowerCase();
  const isEnabled = (v: string) =>
    v === "true" || v === "1" || v === "[sensitive]" || v.includes("sensitive");
  if (isEnabled(rawOtp) || isEnabled(rawPub)) return true;
  // Explicit opt-out only when set to "false"; otherwise allow demo until SMS is live
  if (rawOtp === "false" || rawPub === "false") return false;
  return true;
}

/**
 * PHONE channel: fails closed once real SMS exists.
 * - Local / non-production: demo allowed (no SMS needed to develop).
 * - Production: OTP_PHONE_DEMO_MODE=true|false is an explicit override.
 *   Otherwise demo is allowed ONLY while Africa's Talking is not configured,
 *   so setting AT_USERNAME + AT_API_KEY is the whole go-live switch.
 * - The browser never decides on its own in production (the server is the
 *   authority); NEXT_PUBLIC_OTP_PHONE_DEMO_MODE=true is the only client opt-in.
 */
function phoneDemoOtpAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const isServer = typeof window === "undefined";
  const explicit = parseFlag(
    isServer
      ? process.env.OTP_PHONE_DEMO_MODE
      : process.env.NEXT_PUBLIC_OTP_PHONE_DEMO_MODE,
  );
  if (explicit !== undefined) return explicit;
  if (!isServer) return false;
  const atConfigured = Boolean(
    process.env.AT_API_KEY?.trim() && process.env.AT_USERNAME?.trim(),
  );
  return !atConfigured;
}

/** Whether the shared demo code may stand in for a real code on this channel. */
export function isDemoOtpAllowed(channel: OtpChannel): boolean {
  return channel === "phone" ? phoneDemoOtpAllowed() : legacyDemoOtpAllowed();
}

/** Destination key stored in phone_otps.phone for email channel */
export function emailOtpKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

export function isEmailOtpKey(dest: string): boolean {
  return dest.startsWith("email:");
}
