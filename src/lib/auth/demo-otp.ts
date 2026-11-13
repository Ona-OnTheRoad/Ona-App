/**
 * Demo / fallback OTP for local work and for hosted environments that have
 * not switched on real SMS and email delivery yet.
 *
 * Allowed when:
 * - NODE_ENV is not "production" (local `next dev`, tests), or
 * - OTP_DEMO_MODE=true → server / API routes, or
 * - NEXT_PUBLIC_OTP_DEMO_MODE=true → browser too (artisan onboarding, client helpers)
 *
 * In production the demo code is opt-in: an unset, empty or masked flag means
 * off. Set both flags on the host only while demo OTP is still needed live.
 */
export const DEMO_OTP_CODE = "336699";

export function isDemoOtp(code: string | null | undefined): boolean {
  return String(code || "").replace(/\D/g, "") === DEMO_OTP_CODE;
}

function flagOn(value: string | undefined): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "true" || v === "1";
}

export type OtpChannel = "phone" | "email";

/**
 * Demo codes: local/dev always; production only when a flag is explicitly true.
 * The channel argument is accepted for call-site clarity but does not change the
 * rule: phone and email share one opt-in policy.
 */
export function isDemoOtpAllowed(_channel?: OtpChannel): boolean {
  void _channel;
  if (process.env.NODE_ENV !== "production") return true;
  return (
    flagOn(process.env.OTP_DEMO_MODE) ||
    flagOn(process.env.NEXT_PUBLIC_OTP_DEMO_MODE)
  );
}

/** Destination key stored in phone_otps.phone for email channel */
export function emailOtpKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

export function isEmailOtpKey(dest: string): boolean {
  return dest.startsWith("email:");
}
