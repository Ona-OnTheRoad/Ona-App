import { randomInt } from "node:crypto";
import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { deliverOtp, planOtpDelivery } from "@/lib/server/auth/otp-delivery";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";
import { clientIp } from "@/lib/server/modules/security";
import {
  CHANGE_CONTACT_RESEND_SEC,
  CHANGE_CONTACT_TTL_SEC,
  changeContactKey,
  hashChangeContactCode,
  isChangeContactConfigured,
  normalizeContactTarget,
} from "@/lib/server/otp/change-contact-otp";
import { verifyIdentityProof } from "@/lib/server/otp/identity-proof";
import { findPhoneOwners, phoneTail } from "@/lib/server/otp/phone-owners";
import { DEMO_OTP_CODE, isDemoOtpAllowed } from "@/lib/auth/demo-otp";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_CAP_PER_USER = 5;
const HOURLY_CAP_PER_IP = 20;

const bodySchema = z.object({
  channel: z.enum(["phone", "email"]),
  target: z.string().min(3).max(254),
  identityProof: z.string().min(10).max(600),
});

function appOrigin(req: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured;
  try {
    return new URL(req.url).origin;
  } catch {
    return null;
  }
}

function mask(channel: "phone" | "email", v: string): string {
  if (channel === "phone") return v.length > 8 ? `${v.slice(0, 5)}***${v.slice(-3)}` : "***";
  const [name, domain] = v.split("@");
  return name && domain ? `${name.slice(0, 2)}***@${domain}` : "***";
}

/** Escape LIKE wildcards so an email like "a_b@x.com" only matches itself. */
function likeExact(v: string): string {
  return v.replace(/[\\%_]/g, "\\$&");
}

/**
 * Send a verification code to a NEW phone number or email the signed-in user wants
 * to switch to. Requires a fresh identity proof (POST /api/security/verify-identity).
 * The code is bound to this user and this exact contact, stored hashed, and is
 * checked by POST /api/security/action (change_phone / change_email). Never changes
 * anything by itself and never reveals whether another account exists beyond "in use".
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) return apiFail("Server is not configured", 503);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiFail("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiFail("Enter a valid phone number or email", 400);
  const { channel, identityProof } = parsed.data;

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const target = normalizeContactTarget(channel, parsed.data.target);
  if (!target) {
    return apiFail(
      channel === "phone"
        ? "Enter a valid phone number (e.g. +234…)"
        : "Enter a valid email address",
      400,
      "validation",
    );
  }

  // Order of the flow is enforced here: no identity proof, no code.
  let proofOk = false;
  try {
    proofOk = verifyIdentityProof(identityProof, userId);
  } catch {
    proofOk = false;
  }
  if (!proofOk) {
    return apiFail("Please verify your identity again.", 403, "identity_required");
  }

  const real = planOtpDelivery(channel).kind === "real";
  // The shared demo code can authorise a contact change only in local development.
  const demoAllowed = process.env.NODE_ENV !== "production" && isDemoOtpAllowed();
  if ((!real && !demoAllowed) || !isChangeContactConfigured()) {
    console.error("otp.change_contact.unavailable: provider or signing secret not configured");
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
        key: `change-contact-ip:${ip}`,
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
      key: `change-contact-day:${userId}`,
      limit: DAILY_CAP_PER_USER,
      windowMs: 24 * 60 * 60_000,
    });
    if (!perUser.ok) {
      return apiFail("Too many codes requested today. Try again tomorrow.", 429, "rate_limited", {
        retryAfterSec: perUser.retryAfterSec,
      });
    }

    const supabase = createServiceSupabase();

    // Same as what the user already has: nothing to change.
    const { data: me } = await supabase
      .from("profiles")
      .select("phone, email")
      .eq("id", userId)
      .maybeSingle();
    const current = me as { phone?: string | null; email?: string | null } | null;
    const same =
      channel === "phone"
        ? phoneTail(current?.phone) !== null && phoneTail(current?.phone) === phoneTail(target)
        : (current?.email || "").trim().toLowerCase() === target;
    if (same) {
      return apiFail(
        channel === "phone"
          ? "That is already your phone number."
          : "That is already your email address.",
        400,
        "same_as_current",
      );
    }

    // Already used by another account (shared last-10-digits rule for phones).
    if (channel === "phone") {
      const found = await findPhoneOwners(supabase, target);
      if ("error" in found) return apiFail("Could not check this number. Try again.", 503, "lookup_failed");
      if (found.owners.some((o) => o.id !== userId)) {
        return apiFail("This phone number is already used on another Ona account.", 409, "in_use");
      }
    } else {
      const { data: rows, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", likeExact(target))
        .limit(5);
      if (error) return apiFail("Could not check this email. Try again.", 503, "lookup_failed");
      if ((rows || []).some((r) => (r as { id: string }).id !== userId)) {
        return apiFail("This email is already used on another Ona account.", 409, "in_use");
      }
    }

    const key = changeContactKey(userId, channel, target);

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
        channel,
        to: target,
        code,
        origin: channel === "phone" ? appOrigin(req) : null,
        purpose: "verify",
      });
      if (!sent.ok) {
        console.error(`[change-contact] ${channel} delivery failed: ${sent.error}`);
        return apiFail(
          "We couldn't send the code right now. Please try again shortly.",
          502,
          "delivery_failed",
        );
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
      channel,
      target: mask(channel, target),
      expiresInSec: CHANGE_CONTACT_TTL_SEC,
      resendInSec: CHANGE_CONTACT_RESEND_SEC,
      delivery: real ? channel : "demo",
    });
  } catch (error) {
    const limited = rateLimitUnavailableResponse(error, req);
    if (limited) return limited;
    console.error("[change-contact] send-code failed", error);
    return apiFail("Something went wrong. Please try again.", 500);
  }
}
