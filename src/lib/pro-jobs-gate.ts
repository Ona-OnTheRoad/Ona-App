import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import { proT2CareApproved } from "@/lib/pro-switch-onboarding";
import type { UserProfile } from "@/lib/types";

/**
 * May this signed-in professional fetch and poll jobs?
 *
 * The server decides (`proJobsEligible`: Tier 2 approved, not suspended or
 * rejected). A cached profile from before that field existed falls back to the
 * client-side Tier 2 signals so an approved pro is never cut off.
 */
export function isProJobsEligible(
  accountType: string | null | undefined,
  profile: UserProfile | null | undefined,
  artisan?: Partial<ArtisanVerificationProfile> | null,
): boolean {
  if (accountType !== "professional" || !profile) return false;
  if (profile.proJobsEligible === true) return true;
  if (profile.proJobsEligible === false) return false;
  if (artisan?.status === "suspended" || artisan?.status === "rejected") {
    return false;
  }
  return Boolean(profile.ninVerified) || proT2CareApproved(profile, artisan);
}
