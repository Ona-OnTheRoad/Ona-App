import {
  nextProEmbedTierStep,
  type ProEmbedTierStep,
} from "@/lib/artisan/verification-order";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";

/** Banner + sheet-embed flags derived from the profile (no hooks) */
export function deriveViewFlags(
  profile: ArtisanVerificationProfile,
  opts: {
    embedInSheet: boolean;
    hidePhoneTier: boolean;
    hideGovIdTiers: boolean;
    showLiveness: boolean;
  },
) {
  const { embedInSheet, hidePhoneTier, hideGovIdTiers, showLiveness } = opts;
  // Soft wait state only never hard-lock the whole page after care reset.
  // When ID is submitted and waiting, show banner + still allow reading tiers.
  const waitingCareId =
    profile.status === "pending_review" &&
    profile.govIdReviewStatus === "submitted" &&
    !profile.rejectReason;
  const needsResubmit =
    profile.status === "rejected" ||
    profile.govIdReviewStatus === "rejected" ||
    Boolean(profile.rejectReason);

  const embedStep: ProEmbedTierStep | null = embedInSheet
    ? nextProEmbedTierStep(profile, {
        hidePhone: hidePhoneTier,
        hideGovId: hideGovIdTiers,
      })
    : null;

  return {
    waitingCareId,
    needsResubmit,
    embedStep,
    showEmbedT2Form: embedInSheet && embedStep === "gov_id",
    showEmbedLivenessBtn:
      embedInSheet && embedStep === "liveness" && !showLiveness,
    showEmbedBvnBtn: embedInSheet && embedStep === "bvn",
    showEmbedSkillBtn: embedInSheet && embedStep === "skill",
  };
}
