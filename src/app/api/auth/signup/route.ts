import { rateLimitUnavailableResponse } from "@/lib/server/modules/rate-limit";
import { apiFail } from "@/lib/server/api-json";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { canonicalPhone } from "@/lib/server/phone-match";
import { checkSignupIds, storeIdLookup } from "@/lib/server/identity/signup-id-check";
import { createOrAttachUser, upsertBaseProfile } from "@/lib/server/signup/account";
import { runSignupAftercare } from "@/lib/server/signup/aftercare";
import type { SignupContext } from "@/lib/server/signup/context";
import { logSignupEvent } from "@/lib/server/signup/helpers";
import { writeMotoristProfile } from "@/lib/server/signup/motorist-profile";
import {
  rejectInvalidAge,
  rejectTakenPhone,
  resolveAttachUser,
} from "@/lib/server/signup/preflight";
import { writeProProfile } from "@/lib/server/signup/pro-profile";
import { bodySchema } from "@/lib/server/signup/schema";
import { finishSignup } from "@/lib/server/signup/session";
import type { UserRole } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/signup: public signup via service role.
 * This file is the sequence only; each step lives in src/lib/server/signup/.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail(
      "Server is not configured for sign-up. Contact support.",
      503,
      "supabase_not_configured",
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiFail("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => i.message)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    return apiFail(
      msg ||
        "Please check your name, gender, date of birth, email, phone and password.",
      400,
      "validation",
    );
  }

  try {
    const { rateLimitAsync } = await import("@/lib/server/modules/rate-limit");
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rl = await rateLimitAsync({
      key: `signup:ip:${ip}`,
      limit: 10,
      windowMs: 15 * 60_000,
    });
    if (!rl.ok) {
      return apiFail(
        `Too many sign-up attempts. Retry in ${rl.retryAfterSec}s.`,
        429,
        "rate_limited",
      );
    }
  } catch (error) {
    return rateLimitUnavailableResponse(error, req) || apiFail("Security checks unavailable", 503);
  }

  const input = parsed.data;
  const submittedEmail = input.email.trim().toLowerCase();
  if (!submittedEmail || !submittedEmail.includes("@")) {
    return apiFail(
      "Email is required for Customer and Repair Pro signup.",
      400,
      "validation",
    );
  }
  // Store canonical phone so login must match the same signup number
  const phoneCanonical = canonicalPhone(input.phone);
  if (!phoneCanonical) {
    return apiFail(
      "Phone number is required for Customer and Repair Pro signup (e.g. +234 801…).",
      400,
      "validation",
    );
  }
  // Normalize in-place for all profile writes below
  input.phone = phoneCanonical;
  const role: UserRole =
    input.accountType === "professional" ? "repair_pro" : "motorist";
  const nin = (input.nin || "").replace(/\D/g, "");
  const bvn = (input.bvn || "").replace(/\D/g, "");
  const hasNin = nin.length === 11;
  const hasBvn = bvn.length === 11;

  const ageRejection = rejectInvalidAge(input);
  if (ageRejection) return ageRejection;

  const attach = await resolveAttachUser(input, submittedEmail);
  if (attach instanceof Response) return attach;
  const { attachUserId, email } = attach;

  const supabase = createServiceSupabase();
  const eventBase = {
    email,
    full_name: input.fullName,
    phone: input.phone,
    account_type: input.accountType,
    gender: input.gender,
    date_of_birth: input.dateOfBirth,
  };
  const ctx: SignupContext = {
    supabase, input, email, role, nin, bvn, hasNin, hasBvn, eventBase,
  };

  const phoneRejection = await rejectTakenPhone(ctx, attachUserId);
  if (phoneRejection) return phoneRejection;

  // Server-side NIN/BVN lookup, after the cheap rejections and before any
  // account exists. The outcome is evidence for Care; it never sets a verified flag.
  const idCheck = await checkSignupIds({
    nin: hasNin ? nin : undefined,
    bvn: hasBvn ? bvn : undefined,
    profileName: input.fullName,
    bankAccountName: input.bankAccountName,
  });
  if (!idCheck.ok) {
    await logSignupEvent(supabase, {
      ...eventBase,
      success: false,
      error_message: idCheck.code,
    });
    return apiFail(idCheck.message, idCheck.status, idCheck.code);
  }

  // 1) Create auth user OR attach the other role on the signed-in identity.
  const account = await createOrAttachUser(ctx, attachUserId);
  if (account instanceof Response) return account;
  const { userId, createdNew } = account;

  // 2) Enrich profile
  const profileFailure = await upsertBaseProfile(ctx, userId);
  if (profileFailure) return profileFailure;

  // 3) Role-specific tables
  // Dual-role: NEVER delete the other role's side table when keepOtherRole is true
  // (motorist adding Repair Pro must keep motorist_profiles).
  // Attach path always keeps the original role (anti-fraud merge on same identity).
  const keepOther = attachUserId ? true : input.keepOtherRole !== false;
  const flags =
    role === "motorist"
      ? await writeMotoristProfile(ctx, userId, keepOther)
      : await writeProProfile(ctx, userId, keepOther);
  if (flags instanceof Response) return flags;

  await storeIdLookup(
    supabase,
    role === "motorist" ? "motorist_profiles" : "repair_pro_profiles",
    userId,
    idCheck.records,
  );

  // 4-6) Identity sync, merge detection, referral code and referral event
  await runSignupAftercare(ctx, userId);

  // 7) Session, confirmation email and response
  return finishSignup(ctx, { userId, createdNew, attachUserId }, flags);
}
