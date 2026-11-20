/**
 * Demo / fallback OTP for local work and for hosted environments that have
 * not switched on real SMS and email delivery yet.
 *
 * The flags decide whenever either is set, in every environment:
 * - OTP_DEMO_MODE=true → server / API routes
 * - NEXT_PUBLIC_OTP_DEMO_MODE=true → browser too (artisan onboarding, client helpers)
 * Either one `true` (or `1`) turns demo on; any other set value means off.
 *
 * Only when both are unset or blank does NODE_ENV decide: on outside
 * production (local `next dev`, tests), off in production. So in production
 * the demo code stays opt-in, and locally `OTP_DEMO_MODE=false` really turns
 * it off for testing real delivery. Set both flags together: the browser
 * bundle only sees the public one.
 */
export const DEMO_OTP_CODE = "336699";

export function isDemoOtp(code: string | null | undefined): boolean {
  return String(code || "").replace(/\D/g, "") === DEMO_OTP_CODE;
}

function flagOn(value: string | undefined): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "true" || v === "1";
}

function flagSet(value: string | undefined): boolean {
  return String(value ?? "").trim() !== "";
}

export type OtpChannel = "phone" | "email";

/**
 * Demo codes follow the flags when either is set; with both unset, on outside
 * production and off in production. The channel argument is accepted for
 * call-site clarity but does not change the rule: phone and email share one
 * policy.
 */
export function isDemoOtpAllowed(_channel?: OtpChannel): boolean {
  void _channel;
  // Read each flag directly: Next.js inlines NEXT_PUBLIC_* only for literal
  // `process.env.NAME` accesses, which the browser bundle depends on.
  const server = process.env.OTP_DEMO_MODE;
  const pub = process.env.NEXT_PUBLIC_OTP_DEMO_MODE;
  if (flagSet(server) || flagSet(pub)) return flagOn(server) || flagOn(pub);
  return process.env.NODE_ENV !== "production";
}

/** Destination key stored in phone_otps.phone for email channel */
export function emailOtpKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

export function isEmailOtpKey(dest: string): boolean {
  return dest.startsWith("email:");
}
