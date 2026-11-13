import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/env";
import { emailOtpKey, isDemoOtp, isDemoOtpAllowed } from "@/lib/auth/demo-otp";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";
import { issueIdentityProof } from "@/lib/server/otp/identity-proof";

/** Wrong email codes allowed per code before it is voided. */
const MAX_CODE_ATTEMPTS = 5;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashCode(dest: string, code: string): string {
  return createHash("sha256")
    .update(`${dest}:${code}:${process.env.SUPABASE_SERVICE_ROLE_KEY || "om"}`)
    .digest("hex");
}

const bodySchema = z.object({
  accessToken: z.string().min(10),
  password: z.string().min(1).optional(),
  emailCode: z.string().min(4).max(8).optional(),
  guarantorName: z.string().min(1).optional(),
});

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
  if (!parsed.success)
    return apiFail("Provide at least password plus one additional factor", 400);

  const { accessToken, password, emailCode, guarantorName } = parsed.data;

  // Resolve user via auth client (not service role)
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  const userClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } =
    await userClient.auth.getUser(accessToken);
  if (userErr || !userData?.user)
    return apiFail("Session expired. Sign in again.", 401);

  const userId = userData.user.id;
  const userEmail = userData.user.email;
  if (!userEmail) return apiFail("No email on account", 400);

  // Brute-force guard: every attempt needs the password, but a stolen session
  // must still not be able to hammer the password and the code.
  try {
    const budget = await rateLimitAsync({
      key: `verify-identity:${userId}`,
      limit: 10,
      windowMs: 10 * 60_000,
    });
    if (!budget.ok) {
      return apiFail(
        `Too many attempts. Retry in ${budget.retryAfterSec}s.`,
        429,
        "rate_limited",
      );
    }
  } catch (error) {
    return (
      rateLimitUnavailableResponse(error, req) ||
      apiFail("Security checks unavailable", 503)
    );
  }

  const admin = createServiceSupabase();
  const results: { factor: string; passed: boolean }[] = [];

  // 1. Password verification
  if (password) {
    const { error: pwdErr } = await userClient.auth.signInWithPassword({
      email: userEmail,
      password,
    });
    const passed = !pwdErr;
    results.push({ factor: "password", passed });
    if (!passed) return apiFail("Current password is incorrect.", 403);
  } else {
    return apiFail("Password is required for identity verification.", 400);
  }

  // 2. Email OTP verification use same key format as send route
  if (emailCode) {
    const dest = emailOtpKey(userEmail);

    const { data: otpRows } = await admin
      .from("phone_otps")
      .select("*")
      .eq("phone", dest)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const otp = otpRows?.[0];
    if (!otp) return apiFail("No code found. Request a new one first.", 400);
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      await admin
        .from("phone_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otp.id);
      return apiFail("Code expired. Request a new one.", 400);
    }

    if ((otp.attempts ?? 0) >= MAX_CODE_ATTEMPTS) {
      await admin
        .from("phone_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otp.id);
      return apiFail("Too many attempts. Request a new code.", 429, "otp_locked");
    }

    const demoOk = isDemoOtp(emailCode) && isDemoOtpAllowed("email");
    if (demoOk) {
      results.push({ factor: "email_otp", passed: true });
      await admin
        .from("phone_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otp.id);
    } else {
      const expected = hashCode(dest, emailCode);
      if (expected !== otp.code_hash) {
        await admin
          .from("phone_otps")
          .update({ attempts: (otp.attempts || 0) + 1 })
          .eq("id", otp.id);
        return apiFail("Email code is incorrect.", 401);
      }
      results.push({ factor: "email_otp", passed: true });
      await admin
        .from("phone_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otp.id);
    }
  } else {
    return apiFail("Email verification code is required.", 400);
  }

  // 3. Guarantor name verification: only when a guarantor is on file. Customers
  // (and Repair Pros who have none) have nothing to match, so it must not block them.
  const { data: guarantor } = await admin
    .from("repair_pro_guarantors")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();
  const storedName =
    (guarantor as { full_name?: string } | null)?.full_name?.trim() || "";
  if (storedName) {
    if (!guarantorName) {
      return apiFail("Guarantor name is required for verification.", 400);
    }
    const nameMatch =
      storedName.toLowerCase() === guarantorName.toLowerCase().trim();
    results.push({ factor: "guarantor_name", passed: nameMatch });
    if (!nameMatch)
      return apiFail("Guarantor name does not match our records.", 403);
  }

  // Short-lived, user-bound proof that this identity check just passed. The
  // contact-change endpoints require it, so the browser cannot skip this step.
  let identityProof: string | undefined;
  try {
    identityProof = issueIdentityProof(userId).proof;
  } catch {
    return apiFail("Verification is not available right now.", 503, "proof_unavailable");
  }

  return apiOk({ verified: true, factors: results, identityProof });
}
