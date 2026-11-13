import { randomInt } from "node:crypto";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { deliverOtp, planOtpDelivery } from "@/lib/server/auth/otp-delivery";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";
import { clientIp } from "@/lib/server/modules/security";
import { bankChangeKey } from "@/lib/server/otp/bank-change-otp";
import {
  CHANGE_CONTACT_RESEND_SEC,
  CHANGE_CONTACT_TTL_SEC,
  hashChangeContactCode,
  isChangeContactConfigured,
  normalizeContactTarget,
} from "@/lib/server/otp/change-contact-otp";
import { DEMO_OTP_CODE, isDemoOtpAllowed } from "@/lib/auth/demo-otp";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_CAP_PER_USER = 5;
const HOURLY_CAP_PER_IP = 20;

function appOrigin(req: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured;
  try {
    return new URL(req.url).origin;
  } catch {
    return null;
  }
}

function maskPhone(v: string): string {
  return v.length > 8 ? `${v.slice(0, 5)}***${v.slice(-3)}` : "***";
}

/**
 * Send a security code to the phone number ON THE ACCOUNT (the server reads it; the
 * browser cannot choose where the code goes). Step 1 of changing the payout/refund
 * bank account; step 2 is POST /api/security/change-bank/verify-code.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) return apiFail("Server is not configured", 503);

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const real = planOtpDelivery("phone").kind === "real";
  // The shared demo code can authorise a bank change only in local development.
  const demoAllowed = process.env.NODE_ENV !== "production" && isDemoOtpAllowed();
  if ((!real && !demoAllowed) || !isChangeContactConfigured()) {
    console.error("otp.change_bank.unavailable: SMS provider or signing secret not configured");
    return apiFail(
      "Verification is not available right now. Please try again later.",
      503,
      "delivery_unavailable",
    );
  }

  try {
    const ip = clientIp(req);
    if (ip !== "unknown") {
      const perIp = await rateLimitAsync({
        key: `change-bank-ip:${ip}`,
        limit: HOURLY_CAP_PER_IP,
        windowMs: 60 * 60_000,
      });
      if (!perIp.ok) {
        return apiFail(`Too many code requests. Retry in ${perIp.retryAfterSec}s.`, 429, "rate_limited", {
          retryAfterSec: perIp.retryAfterSec,
        });
      }
    }
    const perUser = await rateLimitAsync({
      key: `change-bank-day:${userId}`,
      limit: DAILY_CAP_PER_USER,
      windowMs: 24 * 60 * 60_000,
    });
    if (!perUser.ok) {
      return apiFail("Too many codes requested today. Try again tomorrow.", 429, "rate_limited", {
        retryAfterSec: perUser.retryAfterSec,
      });
    }

    const supabase = createServiceSupabase();
    const { data: me } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
    const phone = normalizeContactTarget("phone", String((me as { phone?: string | null } | null)?.phone ?? ""));
    if (!phone) {
      return apiFail(
        "Add a phone number to your account before changing your bank account.",
        400,
        "no_phone",
      );
    }

    const key = bankChangeKey(userId, phone);

    // Resend cooldown: the previous code is probably still on its way.
    const { data: recent } = await supabase
      .from("phone_otps")
      .select("id, created_at, consumed_at")
      .eq("phone", key)
      .order("created_at", { ascending: false })
      .limit(1);
    const last = (recent?.[0] || null) as { created_at?: string; consumed_at?: string | null } | null;
    if (last?.created_at && !last.consumed_at) {
      const age = Date.now() - new Date(last.created_at).getTime();
      if (age < CHANGE_CONTACT_RESEND_SEC * 1000) {
        const wait = Math.ceil((CHANGE_CONTACT_RESEND_SEC * 1000 - age) / 1000);
        return apiFail(`Please wait ${wait}s before requesting another code.`, 429, "resend_wait", {
          retryAfterSec: wait,
        });
      }
    }

    const code = real ? String(randomInt(100000, 999999)) : DEMO_OTP_CODE;

    // Deliver BEFORE storing: a failed send must not rotate the code the user
    // already holds, nor leave a stored code nobody received.
    if (real) {
      const sent = await deliverOtp({
        channel: "phone",
        to: phone,
        code,
        origin: appOrigin(req),
        purpose: "verify",
      });
      if (!sent.ok) {
        console.error(`[change-bank] sms delivery failed: ${sent.error}`);
        return apiFail("We couldn't send the code right now. Please try again shortly.", 502, "delivery_failed");
      }
    }

    await supabase
      .from("phone_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("phone", key)
      .is("consumed_at", null);
    const { error: insertError } = await supabase.from("phone_otps").insert({
      phone: key,
      code_hash: hashChangeContactCode(key, code),
      expires_at: new Date(Date.now() + CHANGE_CONTACT_TTL_SEC * 1000).toISOString(),
    });
    if (insertError) return apiFail("Could not create a code. Try again.", 500);

    return apiOk({
      sent: true,
      phone: maskPhone(phone),
      expiresInSec: CHANGE_CONTACT_TTL_SEC,
      resendInSec: CHANGE_CONTACT_RESEND_SEC,
      delivery: real ? "sms" : "demo",
    });
  } catch (error) {
    const limited = rateLimitUnavailableResponse(error, req);
    if (limited) return limited;
    console.error("[change-bank] send-code failed", error);
    return apiFail("Something went wrong. Please try again.", 500);
  }
}
