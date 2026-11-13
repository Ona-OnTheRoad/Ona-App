import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";
import { issuePhoneProof, PHONE_PROOF_TTL_MS } from "@/lib/server/otp/phone-proof";
import {
  hashSignupCode,
  isPhoneInUse,
  SIGNUP_OTP_MAX_ATTEMPTS,
  signupOtpKey,
} from "@/lib/server/otp/signup-otp";
import { canonicalPhone } from "@/lib/server/phone-match";
import { isDemoOtp, isDemoOtpAllowed } from "@/lib/auth/demo-otp";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  phone: z.string().min(7).max(32),
  code: z.string().min(4).max(8),
});

function sameHash(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Check a signup code. On success returns a short-lived proof that this number
 * received the code; it does NOT create a session or an account.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server is not configured", 503);
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiFail("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiFail("Enter the 6-digit code", 400);
  const phone = canonicalPhone(parsed.data.phone);
  if (!phone) return apiFail("Enter a valid phone number", 400);
  const code = parsed.data.code.replace(/\D/g, "");
  if (code.length < 4) return apiFail("Enter the 6-digit code", 400);

  const dest = signupOtpKey(phone);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  try {
    if (ip !== "unknown") {
      const perIp = await rateLimitAsync({
        key: `signup-otp-verify-ip:${ip}`,
        limit: 60,
        windowMs: 60 * 60_000,
      });
      if (!perIp.ok) {
        return apiFail(
          `Too many attempts. Retry in ${perIp.retryAfterSec}s.`,
          429,
          "rate_limited",
        );
      }
    }

    const supabase = createServiceSupabase();

    // Somebody may have registered this number since the code was sent.
    const used = await isPhoneInUse(supabase, phone);
    if ("error" in used) return apiFail("Could not check this number. Try again.", 500);
    if (used.inUse) {
      return apiFail(
        "This number already has an Ona account. Log in instead, or use a different number.",
        409,
        "phone_in_use",
      );
    }

    // Development only: never lets the demo code mint a proof in production.
    const demoOk =
      isDemoOtp(code) &&
      process.env.NODE_ENV !== "production" &&
      isDemoOtpAllowed("phone");
    if (!demoOk) {
      const { data: rows, error } = await supabase
        .from("phone_otps")
        .select("*")
        .eq("phone", dest)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) return apiFail("Could not check the code. Try again.", 500);
      const otp = rows?.[0] as
        | { id: string; code_hash: string; expires_at: string; attempts?: number }
        | undefined;
      if (!otp) {
        return apiFail("No active code. Tap Resend code.", 400, "otp_missing");
      }
      const consume = () =>
        supabase
          .from("phone_otps")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", otp.id);

      if (new Date(otp.expires_at).getTime() < Date.now()) {
        await consume();
        return apiFail("Code expired. Request a new one.", 400, "otp_expired");
      }
      if ((otp.attempts ?? 0) >= SIGNUP_OTP_MAX_ATTEMPTS) {
        await consume();
        return apiFail("Too many attempts. Request a new code.", 429, "otp_locked");
      }
      if (!sameHash(hashSignupCode(phone, code), String(otp.code_hash))) {
        const failed = (otp.attempts ?? 0) + 1;
        await supabase
          .from("phone_otps")
          .update({ attempts: failed })
          .eq("id", otp.id);
        return apiFail(
          failed >= SIGNUP_OTP_MAX_ATTEMPTS
            ? "Too many incorrect codes. Request a new code."
            : "Incorrect code. Try again.",
          401,
          "otp_invalid",
          { failedAttempts: failed, maxAttempts: SIGNUP_OTP_MAX_ATTEMPTS },
        );
      }
      await consume();
    } else {
      await supabase
        .from("phone_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("phone", dest)
        .is("consumed_at", null);
    }

    let proof: string;
    try {
      proof = issuePhoneProof(phone).proof;
    } catch (e) {
      console.error("otp.signup.proof_unavailable", e instanceof Error ? e.message : e);
      return apiFail("Could not confirm the code. You can skip for now.", 503, "proof_unavailable");
    }
    return apiOk({
      verified: true,
      phone,
      proof,
      proofExpiresInSec: Math.floor(PHONE_PROOF_TTL_MS / 1000),
    });
  } catch (e) {
    return (
      rateLimitUnavailableResponse(e, req) ||
      apiFail("Could not check the code. Try again.", 500)
    );
  }
}
