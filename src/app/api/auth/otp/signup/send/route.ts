import { randomInt } from "node:crypto";
import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { deliverOtp } from "@/lib/server/auth/otp-delivery";
import { isSmsConfigured } from "@/lib/server/sms/send";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";
import {
  hashSignupCode,
  isPhoneInUse,
  SIGNUP_OTP_RESEND_SEC,
  SIGNUP_OTP_TTL_SEC,
  signupOtpKey,
} from "@/lib/server/otp/signup-otp";
import { isPhoneProofConfigured } from "@/lib/server/otp/phone-proof";
import { canonicalPhone } from "@/lib/server/phone-match";
import { DEMO_OTP_CODE, isDemoOtpAllowed } from "@/lib/auth/demo-otp";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ phone: z.string().min(7).max(32) });

/**
 * Mobile networks put many people behind one IP (carrier NAT), so the per-IP cap
 * is generous. The per-number cap and the global daily budget are the real
 * protection against SMS pumping (this endpoint texts numbers with no account).
 */
const HOURLY_CAP_PER_IP = 20;
const DAILY_CAP_PER_NUMBER = 5;
const DEFAULT_DAILY_BUDGET = 3000;

function dailyBudget(): number {
  const n = Number(process.env.OTP_SIGNUP_DAILY_BUDGET);
  return Number.isSafeInteger(n) && n > 0 ? n : DEFAULT_DAILY_BUDGET;
}

function maskDest(dest: string): string {
  return dest.length > 8 ? `${dest.slice(0, 7)}***${dest.slice(-4)}` : "***";
}

function appOrigin(req: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured;
  try {
    return new URL(req.url).origin;
  } catch {
    return null;
  }
}

/**
 * Text a verification code to a number that has no account yet (signup step
 * "Verify your number"). Never signs anyone in.
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
  if (!parsed.success) return apiFail("Enter a valid phone number", 400);
  const phone = canonicalPhone(parsed.data.phone);
  if (!phone) return apiFail("Enter a valid phone number (e.g. +234…)", 400);

  // The demo code is a development convenience only. In production a signup code
  // must come from a real SMS, otherwise "verified" would mean nothing.
  const demoAllowed =
    process.env.NODE_ENV !== "production" && isDemoOtpAllowed("phone");
  // Any configured SMS provider counts (the delivery layer fails over between them).
  const smsReady = isSmsConfigured();
  if ((!smsReady && !demoAllowed) || !isPhoneProofConfigured()) {
    console.error("otp.signup.unavailable: SMS provider or proof secret not configured");
    return apiFail(
      "Phone verification isn't available right now. You can skip for now and verify later.",
      503,
      "sms_unavailable",
    );
  }

  const dest = signupOtpKey(phone);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  try {
    if (ip !== "unknown") {
      const perIp = await rateLimitAsync({
        key: `signup-otp-ip:${ip}`,
        limit: HOURLY_CAP_PER_IP,
        windowMs: 60 * 60_000,
      });
      if (!perIp.ok) {
        return apiFail(
          `Too many code requests. Retry in ${perIp.retryAfterSec}s.`,
          429,
          "rate_limited",
          { retryAfterSec: perIp.retryAfterSec },
        );
      }
    }
    const perNumber = await rateLimitAsync({
      key: `signup-otp-day:${phone}`,
      limit: DAILY_CAP_PER_NUMBER,
      windowMs: 24 * 60 * 60_000,
    });
    if (!perNumber.ok) {
      return apiFail(
        "Too many codes requested for this number today. You can skip for now and verify later.",
        429,
        "rate_limited",
        { retryAfterSec: perNumber.retryAfterSec },
      );
    }

    const supabase = createServiceSupabase();

    // A number that already has an account cannot sign up again.
    const used = await isPhoneInUse(supabase, phone);
    if ("error" in used) return apiFail("Could not check this number. Try again.", 500);
    if (used.inUse) {
      return apiFail(
        "This number already has an Ona account. Log in instead, or use a different number.",
        409,
        "phone_in_use",
      );
    }

    // Resend cooldown: the previous code is probably still on its way.
    const { data: recent } = await supabase
      .from("phone_otps")
      .select("id, created_at, consumed_at")
      .eq("phone", dest)
      .order("created_at", { ascending: false })
      .limit(1);
    const last = (recent?.[0] || null) as
      | { created_at?: string; consumed_at?: string | null }
      | null;
    if (last?.created_at && !last.consumed_at) {
      const age = Date.now() - new Date(last.created_at).getTime();
      if (age < SIGNUP_OTP_RESEND_SEC * 1000) {
        const wait = Math.ceil((SIGNUP_OTP_RESEND_SEC * 1000 - age) / 1000);
        return apiFail(
          `Please wait ${wait}s before requesting another code.`,
          429,
          "resend_wait",
          { retryAfterSec: wait },
        );
      }
    }

    // Circuit breaker on total spend: counted only when a real SMS is about to go out.
    if (smsReady) {
      const day = new Date().toISOString().slice(0, 10);
      const budget = await rateLimitAsync({
        key: `signup-otp-budget:${day}`,
        limit: dailyBudget(),
        windowMs: 24 * 60 * 60_000,
      });
      if (!budget.ok) {
        console.error("otp.signup.daily_budget_exhausted");
        return apiFail(
          "Phone verification is busy right now. You can skip for now and verify later.",
          503,
          "sms_busy",
        );
      }
    }

    const useDemoCode = demoAllowed && !smsReady;
    const code = useDemoCode ? DEMO_OTP_CODE : String(randomInt(100000, 999999));
    const now = new Date().toISOString();

    await supabase
      .from("phone_otps")
      .update({ consumed_at: now })
      .eq("phone", dest)
      .is("consumed_at", null);
    const { error: insertError } = await supabase.from("phone_otps").insert({
      phone: dest,
      code_hash: hashSignupCode(phone, code),
      expires_at: new Date(Date.now() + SIGNUP_OTP_TTL_SEC * 1000).toISOString(),
    });
    if (insertError) return apiFail("Could not create a code. Try again.", 500);

    let delivery: "sms" | "demo" = "demo";
    if (smsReady) {
      const sms = await deliverOtp({
        channel: "phone",
        to: phone,
        code,
        origin: appOrigin(req),
      });
      if (sms.ok) {
        delivery = "sms";
      } else {
        // Never claim "sent" when the gateway refused: log the cause (no code, masked number).
        console.error("otp.signup.sms_failed", {
          to: maskDest(phone),
          error: sms.error,
        });
        if (!demoAllowed) {
          await supabase
            .from("phone_otps")
            .update({ consumed_at: new Date().toISOString() })
            .eq("phone", dest)
            .is("consumed_at", null);
          return apiFail(
            "We couldn't send the SMS right now. You can try again, or skip and verify later.",
            502,
            "sms_failed",
          );
        }
      }
    }

    return apiOk({
      sent: true,
      phone,
      expiresInSec: SIGNUP_OTP_TTL_SEC,
      resendInSec: SIGNUP_OTP_RESEND_SEC,
      delivery,
      message: delivery === "sms" ? "Code sent by SMS." : "Code sent.",
    });
  } catch (e) {
    return (
      rateLimitUnavailableResponse(e, req) ||
      apiFail("Could not send the code. Try again.", 500)
    );
  }
}
