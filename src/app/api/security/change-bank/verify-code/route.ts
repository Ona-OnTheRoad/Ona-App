import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";
import { clientIp } from "@/lib/server/modules/security";
import {
  BANK_CHANGE_PROOF_TTL_MS,
  issueBankChangeProof,
} from "@/lib/server/otp/bank-change-proof";
import { bankChangeKey } from "@/lib/server/otp/bank-change-otp";
import { consumeOtpByKey, normalizeContactTarget } from "@/lib/server/otp/change-contact-otp";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ code: z.string().min(4).max(8) });

/**
 * Check the code sent by /change-bank/send-code. On success returns a short-lived
 * proof, which POST /api/security/action (change_bank) requires. Changes nothing itself.
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
  if (!parsed.success) return apiFail("Enter the 6-digit code", 400);

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  try {
    const ip = clientIp(req);
    if (ip !== "unknown") {
      const perIp = await rateLimitAsync({
        key: `change-bank-verify-ip:${ip}`,
        limit: 60,
        windowMs: 60 * 60_000,
      });
      if (!perIp.ok) {
        return apiFail(`Too many attempts. Retry in ${perIp.retryAfterSec}s.`, 429, "rate_limited");
      }
    }
    const perUser = await rateLimitAsync({
      key: `change-bank-verify:${userId}`,
      limit: 20,
      windowMs: 60 * 60_000,
    });
    if (!perUser.ok) {
      return apiFail(`Too many attempts. Retry in ${perUser.retryAfterSec}s.`, 429, "rate_limited");
    }

    const supabase = createServiceSupabase();
    const { data: me } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
    const phone = normalizeContactTarget("phone", String((me as { phone?: string | null } | null)?.phone ?? ""));
    if (!phone) {
      return apiFail("Add a phone number to your account first.", 400, "no_phone");
    }

    let check;
    try {
      check = await consumeOtpByKey(supabase, { key: bankChangeKey(userId, phone), code: parsed.data.code });
    } catch {
      // Signing secret missing: fail closed.
      return apiFail("Verification is not available right now.", 503, "proof_unavailable");
    }
    if (!check.ok) return apiFail(check.message, check.status, check.code);

    let bankProof: string;
    try {
      bankProof = issueBankChangeProof(userId).proof;
    } catch {
      return apiFail("Verification is not available right now.", 503, "proof_unavailable");
    }
    return apiOk({
      verified: true,
      bankProof,
      expiresInSec: Math.floor(BANK_CHANGE_PROOF_TTL_MS / 1000),
    });
  } catch (error) {
    const limited = rateLimitUnavailableResponse(error, req);
    if (limited) return limited;
    console.error("[change-bank] verify-code failed", error);
    return apiFail("Something went wrong. Please try again.", 500);
  }
}
