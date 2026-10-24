import { getVaultProfile } from "@/lib/profiles-vault";
import { backendUpdateProfile, isAppBackendOnline } from "@/lib/supabase/app-api";
import type { UserProfile } from "@/lib/types";

export function isBankComplete(p: UserProfile | null | undefined): boolean {
  return Boolean(
    p &&
    (p.bankCode || "").trim() &&
    (p.bankAccountName || "").trim() &&
    (p.bankAccountNumber || "").replace(/\D/g, "").length === 10,
  );
}

export function inheritDonorBank(
  switched: UserProfile,
  userProfile: UserProfile | null,
  userId: string,
): UserProfile {
  if (isBankComplete(switched)) return switched;
  const vaultMot = getVaultProfile("motorist");
  const vaultPro = getVaultProfile("professional");
  const donor =
    (isBankComplete(vaultMot) && vaultMot) ||
    (isBankComplete(vaultPro) && vaultPro) ||
    (isBankComplete(userProfile) && userProfile) ||
    null;
  if (!donor) return switched;
  const updated: UserProfile = {
    ...switched,
    bankCode: donor.bankCode,
    bankName: donor.bankName,
    bankAccountName: donor.bankAccountName,
    bankAccountNumber: donor.bankAccountNumber,
  };
  if (isAppBackendOnline() && userId) {
    void (async () => {
      try {
        const { ensureAppSession } = await import("@/lib/supabase/session");
        const s = await ensureAppSession();
        if (!s?.accessToken) return;
        await backendUpdateProfile(s.accessToken, {
          bankCode: donor.bankCode,
          bankName: donor.bankName,
          bankAccountName: donor.bankAccountName,
          bankAccountNumber: donor.bankAccountNumber,
        });
      } catch {
        /* non-fatal */
      }
    })();
  }
  return updated;
}

export function mergeSwitchedVerification(
  switched: UserProfile,
  prev: UserProfile | null,
): UserProfile {
  return {
    ...switched,
    phoneVerified: Boolean(switched.phoneVerified || prev?.phoneVerified),
    identityReviewStatus:
      switched.identityReviewStatus || prev?.identityReviewStatus,
    govIdVerified: Boolean(switched.govIdVerified || prev?.govIdVerified),
    identityVerifiedAt: switched.identityVerifiedAt || prev?.identityVerifiedAt,
    identitySubmittedAt:
      switched.identitySubmittedAt || prev?.identitySubmittedAt,
    govIdKind: switched.govIdKind || prev?.govIdKind,
    govIdFrontUrl: switched.govIdFrontUrl || prev?.govIdFrontUrl,
    ninVerified: Boolean(switched.ninVerified || prev?.ninVerified),
    bvnVerified: Boolean(switched.bvnVerified || prev?.bvnVerified),
  };
}
