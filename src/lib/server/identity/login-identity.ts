import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import { ensureUserRole, syncPayoutAcrossRoles } from "./identity-sync";
import { loadOrRepairLoginProfile } from "./login-profile";

export type LoginIdentityResult = Awaited<ReturnType<typeof loadOrRepairLoginProfile>>;

/** Load the login identity, then self-heal attached roles and reload shared bank data. */
export async function loadLoginIdentity(
  userId: string,
  email: string,
  meta: Record<string, unknown> | undefined,
): Promise<LoginIdentityResult> {
  const loaded = await loadOrRepairLoginProfile(userId, email, meta);
  if (!loaded || !("profile" in loaded)) return loaded;

  let { profile, hasMotorist, hasPro } = loaded;

  // Unified identity self-heal: register attached roles + sync bank.
  // Do NOT auto-merge other accounts on login (account-takeover risk).
  // Duplicates are flagged at signup via detectMergeCandidatesForUser.
  try {
    const admin = createServiceSupabase();

    if (hasMotorist) {
      await ensureUserRole(admin, userId, "motorist", {
        userId,
        source: "login",
      });
    }
    if (hasPro) {
      await ensureUserRole(admin, userId, "repair_pro", {
        userId,
        source: "login",
      });
    }
    await syncPayoutAcrossRoles(admin, userId, { userId, source: "login" });

    // Re-load after bank mirror so Pro session sees Customer bank (and reverse)
    const again = await loadOrRepairLoginProfile(
      userId,
      email,
      meta,
    );
    if (again && "profile" in again && again.profile) {
      profile = again.profile;
      hasMotorist = again.hasMotorist;
      hasPro = again.hasPro;
    }
  } catch (e) {
    console.error("login identity sync failed", e);
  }

  return { profile, hasMotorist, hasPro };
}
