import { rateLimitAsync, rateLimitUnavailableResponse } from "@/lib/server/modules/rate-limit";
import { createHash, randomInt } from "crypto";
import { apiFail, apiOk } from "@/lib/server/api-json";
import {
  isAfricaTalkingConfigured,
  normalizeNgPhone,
  sendLoginOtpSms,
} from "@/lib/server/africastalking";
import { phoneOrFilter, phonesMatch } from "@/lib/server/phone-match";
import {
  DEMO_OTP_CODE,
  emailOtpKey,
  isDemoOtpAllowed,
} from "@/lib/auth/demo-otp";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { runIdempotent } from "@/lib/server/idempotency";
import { authOtpSendBodySchema as bodySchema } from "@/lib/server/openapi/schemas/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimum gap between two codes to the same destination (also drives the app's resend timer). */
const RESEND_COOLDOWN_SEC = 30;
/** Hard ceiling of codes per destination per day: SMS costs money and can be abused. */
const DAILY_CAP_PER_DEST = 10;
/** Codes per client IP per hour across all numbers (pumping guard). */
const HOURLY_CAP_PER_IP = 30;

/** Mask a destination for logs: +2348031234567 -> +234803***4567. */
function maskDest(dest: string): string {
  return dest.length > 8 ? `${dest.slice(0, 7)}***${dest.slice(-4)}` : "***";
}

/** Public origin of the app: lets Chrome auto-fill the code from the SMS (WebOTP). */
function appOrigin(req: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured;
  try {
    return new URL(req.url).origin;
  } catch {
    return null;
  }
}

function hashCode(dest: string, code: string): string {
  return createHash("sha256")
    .update(`${dest}:${code}:${process.env.SUPABASE_SERVICE_ROLE_KEY || "om"}`)
    .digest("hex");
}

/**
 * Send login/signup OTP to phone or email.
 * Always succeeds in demo mode when SMS/email provider is missing
 * user can enter DEMO_OTP_CODE (336699).
 *
 * The code-issue + delivery step is ledger-idempotent (runIdempotent):
 * the result is recorded so a retry with the same opKey returns the same
 * code status instead of consuming/rotating the code that already went out.
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
  if (!parsed.success) {
    return apiFail("Choose phone or email and enter a valid target", 400);
  }

  try {
    const channel = parsed.data.channel;
    const supabase = createServiceSupabase();

    let dest: string;
    let displayTarget: string;

    if (channel === "phone") {
      const phone = normalizeNgPhone(parsed.data.target);
      if (!phone) {
        return apiFail("Enter a valid phone number (e.g. +234…)", 400);
      }
      dest = phone;
      displayTarget = phone;

      // Login phone must match the number registered at signup (normalized).
      const orFilter = phoneOrFilter(phone);
      const { data: profiles, error: findErr } = await supabase
        .from("profiles")
        .select("id, phone, is_active")
        .eq("is_active", true)
        .or(orFilter)
        .limit(25);
      if (findErr) return apiFail(findErr.message, 500);

      const match = (profiles || []).find((p) => phonesMatch(p.phone, phone));

      if (!match) {
        return apiFail(
          "This phone is not registered. Use the exact number from signup.",
          404,
          "phone_not_registered",
        );
      }
    } else {
      const email = parsed.data.target.trim().toLowerCase();
      if (!email.includes("@") || email.length < 5) {
        return apiFail("Enter a valid email address", 400);
      }
      dest = emailOtpKey(email);
      displayTarget = email;

      const { data: profile, error: findErr } = await supabase
        .from("profiles")
        .select("id, email, is_active")
        .eq("is_active", true)
        .ilike("email", email)
        .maybeSingle();
      if (findErr) return apiFail(findErr.message, 500);
      if (!profile) {
        return apiFail(
          "No Ona account found for this email. Sign up first.",
          404,
          "email_not_registered",
        );
      }
    }

    const result = await runIdempotent({
      opKey: parsed.data.opKey || null,
      opType: `otp.send.${channel}`,
      actorKind: channel,
      actorId: parsed.data.opActorId || dest,
      beforeRun: async () => {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") || "unknown";
        const budget = await rateLimitAsync({
          key: `otp-send:${ip}:${channel}:${dest}`, limit: 8, windowMs: 10 * 60_000,
        });
        if (!budget.ok) {
          throw Object.assign(new Error(`Too many code requests. Retry in ${budget.retryAfterSec}s.`),
            { status: 429, code: "rate_limited" });
        }
        // Real SMS costs money: cap per number per day and per IP per hour.
        const day = await rateLimitAsync({
          key: `otp-send-day:${channel}:${dest}`, limit: DAILY_CAP_PER_DEST, windowMs: 24 * 60 * 60_000,
        });
        if (!day.ok) {
          throw Object.assign(new Error("Too many codes requested today. Try again tomorrow or use password login."),
            { status: 429, code: "rate_limited" });
        }
        if (ip !== "unknown") {
          const perIp = await rateLimitAsync({
            key: `otp-send-ip:${ip}`, limit: HOURLY_CAP_PER_IP, windowMs: 60 * 60_000,
          });
          if (!perIp.ok) {
            throw Object.assign(new Error(`Too many code requests. Retry in ${perIp.retryAfterSec}s.`),
              { status: 429, code: "rate_limited" });
          }
        }
      },
      run: async () => {
        /**
         * Cooldown only after 4+ failed verify attempts on the latest code.
         * First sends / normal resends are free of the wait message.
         */
        const { data: recent } = await supabase
          .from("phone_otps")
          .select("id, created_at, attempts, consumed_at")
          .eq("phone", dest)
          .order("created_at", { ascending: false })
          .limit(1);

        const last = recent?.[0] as
          | {
              id?: string;
              created_at?: string;
              attempts?: number;
              consumed_at?: string | null;
            }
          | undefined;
        // Resend cooldown: a second code inside the window would just burn SMS credit
        // (the first one is probably still on its way).
        if (last?.created_at && !last.consumed_at) {
          const age = Date.now() - new Date(last.created_at).getTime();
          if (age < RESEND_COOLDOWN_SEC * 1000) {
            const wait = Math.ceil((RESEND_COOLDOWN_SEC * 1000 - age) / 1000);
            return {
              ok: false as const,
              error: `Please wait ${wait}s before requesting another code.`,
            };
          }
        }
        const failedAttempts = Number(last?.attempts ?? 0);
        if (failedAttempts >= 4 && last?.created_at && !last.consumed_at) {
          const COOLDOWN_MS = 45_000;
          const age = Date.now() - new Date(last.created_at).getTime();
          if (age < COOLDOWN_MS) {
            const wait = Math.ceil((COOLDOWN_MS - age) / 1000);
            return {
              ok: false as const,
              error: `Please wait ${wait}s before requesting another code.`,
            };
          }
        }

        // When demo mode is on (or no SMS provider for phone), store 336699
        // so hash path and demo path both succeed. Verify also accepts demo.
        const demoAllowed = isDemoOtpAllowed(channel);
        const smsReady = isAfricaTalkingConfigured();
        // Live phone OTP is switched on by config alone: once Africa's Talking is
        // configured the phone demo code stops being accepted (see demo-otp.ts).
        if (channel === "phone" && !smsReady && !demoAllowed) {
          console.error("otp.sms_unavailable: SMS provider not configured and demo code disabled");
          return {
            ok: false as const,
            error: "SMS is temporarily unavailable. Please try again later or use password login.",
          };
        }
        const useDemoCode =
          demoAllowed && (channel === "email" || !smsReady);
        const code = useDemoCode
          ? DEMO_OTP_CODE
          : String(randomInt(100000, 999999));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await supabase
          .from("phone_otps")
          .update({ consumed_at: new Date().toISOString() })
          .eq("phone", dest)
          .is("consumed_at", null);

        const { error: insErr } = await supabase.from("phone_otps").insert({
          phone: dest,
          code_hash: hashCode(dest, code),
          expires_at: expiresAt,
        });
        if (insErr) return { ok: false as const, error: insErr.message };

        let delivery: "sms" | "demo" | "email_demo" = "demo";
        // Never expose "SMS not configured" / demo codes in the client message
        let deliveryNote = "Code sent. Enter it below.";

        if (channel === "phone" && smsReady) {
          const sms = await sendLoginOtpSms({
            to: dest,
            code,
            origin: appOrigin(req),
          });
          if (sms.ok) {
            delivery = "sms";
            deliveryNote = "Code sent by SMS. Enter it below.";
          } else {
            // Never claim "sent" when the gateway refused it: the user would wait
            // for a text that is not coming. Log the cause for ops (no code in it).
            console.error("otp.sms_failed", {
              to: maskDest(dest),
              statusCode: sms.statusCode,
              error: sms.error,
            });
            if (!demoAllowed) {
              await supabase
                .from("phone_otps")
                .update({ consumed_at: new Date().toISOString() })
                .eq("phone", dest)
                .is("consumed_at", null);
              return {
                ok: false as const,
                error: "We couldn't send the SMS right now. Please try again in a moment.",
              };
            }
            deliveryNote = "Code sent. Enter it below.";
          }
        } else if (channel === "email") {
          // Real email provider not wired yet demo path (UI stays neutral)
          delivery = "email_demo";
          deliveryNote = "Code sent. Enter it below.";
        }

        return {
          ok: true as const,
          result: {
            sent: true,
            channel,
            target: displayTarget,
            expiresInSec: 600,
            resendInSec: RESEND_COOLDOWN_SEC,
            delivery,
            message: deliveryNote,
          },
        };
      },
    });

    if (result.status === "processing") {
      // A concurrent duplicate is still settling never report failure here.
      // The client verifies against /api/ops/status instead.
      return apiOk({
        sent: false,
        pending: true,
        channel,
      });
    }
    if (result.status === "error") {
      return apiFail(result.error, 400);
    }
    return apiOk(result.result);
  } catch (e) {
    const unavailable = rateLimitUnavailableResponse(e, req);
    if (unavailable) return unavailable;
    if (e instanceof Error && "status" in e && e.status === 429) {
      return apiFail(e.message, 429, "rate_limited");
    }
    return apiFail(e instanceof Error ? e.message : "Could not send code", 500);
  }
}
