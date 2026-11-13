import "server-only";
import {
  detectMergeCandidatesForUser,
  runIdentitySync,
} from "@/lib/server/identity/identity-sync";
import type { SignupContext } from "@/lib/server/signup/context";

/** Non-blocking follow-ups once the account rows exist. Never fails signup. */
export async function runSignupAftercare(
  ctx: SignupContext,
  userId: string,
): Promise<void> {
  const { supabase, input } = ctx;
  // Unified identity sync: register this role on the identity and carry over
  // any bank already saved on the user's other role (payout_methods + mirror).
  // Runs for both brand-new and dual-role ("attach to existing account") signups.
  try {
    await runIdentitySync(supabase, userId, { source: "signup" });
  } catch (e) {
    console.error("identity sync after signup failed", e);
  }

  // Signup-time duplicate detection: if this account shares a NIN/BVN last-4,
  // Driver's Licence or Passport number with an existing (non-deleted) account,
  // queue the pair for admin review never merges automatically.
  try {
    await detectMergeCandidatesForUser(supabase, userId, {
      userId,
      source: "signup",
    });
  } catch (e) {
    console.error("signup merge detection failed", e);
  }

  // 5) Generate referral code for new user (non-blocking)
  {
    const suffix = userId.replace(/-/g, "").slice(-6).toUpperCase();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++)
      code += chars[Math.floor(Math.random() * chars.length)];
    const refCode = `ONA${code}${suffix}`;
    const refLink = `/login/role?ref=${refCode}`;
    try {
      await supabase.from("referral_codes").upsert(
        {
          user_id: userId,
          referral_code: refCode,
          referral_link: refLink,
          active: true,
        },
        { onConflict: "user_id" },
      );
    } catch {
      /* non-fatal referral code not critical for signup */
    }
  }

  // 6) Handle incoming referral code (?ref= param)
  if (input.refCode) {
    try {
      const { data: refOwner } = await supabase
        .from("referral_codes")
        .select("user_id")
        .eq("referral_code", input.refCode.toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (refOwner && refOwner.user_id !== userId) {
        await supabase.from("referral_events").insert({
          referrer_user_id: refOwner.user_id,
          referred_user_id: userId,
          referral_code_used: input.refCode.toUpperCase(),
        });
      }
    } catch {
      /* non-fatal */
    }
  }
}
