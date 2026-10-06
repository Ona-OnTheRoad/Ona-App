import { Check, Loader2 } from "lucide-react";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";

/** Gov ID submit button content + disabled state (page + sheet footer) */
export function govIdSubmitState(
  profile: ArtisanVerificationProfile,
  idBusy: "gov" | "nin" | null,
) {
  const label =
    idBusy === "gov" ? (
      <>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </>
    ) : profile.tiers.tier2_govId ||
      profile.govIdReviewStatus === "approved" ? (
      <>
        <Check className="h-3.5 w-3.5" /> ID approved
      </>
    ) : profile.govIdReviewStatus === "submitted" ? (
      "ID currently in review"
    ) : (
      "Submit ID for review"
    );
  const disabled =
    idBusy === "gov" ||
    profile.tiers.tier2_govId ||
    profile.govIdReviewStatus === "submitted" ||
    profile.govIdReviewStatus === "approved";
  return { label, disabled };
}

export function bvnSubmitDisabled(
  profile: ArtisanVerificationProfile,
  idBusy: "gov" | "nin" | null,
): boolean {
  return (
    idBusy === "nin" ||
    profile.tiers.tier2_nin ||
    profile.ninReviewStatus === "submitted"
  );
}

/** BVN submit button content (page + sheet footer) */
export function BvnSubmitLabel({
  profile,
  idBusy,
}: {
  profile: ArtisanVerificationProfile;
  idBusy: "gov" | "nin" | null;
}) {
  if (idBusy === "nin") {
    return (
      <>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </>
    );
  }
  if (profile.tiers.tier2_nin) {
    return (
      <>
        <Check className="h-3.5 w-3.5" /> Approved
      </>
    );
  }
  if (profile.ninReviewStatus === "submitted")
    return <>BVN currently in review</>;
  return <>Submit BVN for review</>;
}

export function skillSubmitLabel(profile: ArtisanVerificationProfile): string {
  return profile.tiers.tier4_skillProof ||
    profile.skillProofStatus === "under_review"
    ? "Skill currently in review"
    : "Submit skill for review";
}

export function skillSubmitDisabled(
  profile: ArtisanVerificationProfile,
  busy: boolean,
): boolean {
  return (
    busy ||
    !profile.skillProof ||
    profile.tiers.tier4_skillProof ||
    profile.skillProofStatus === "under_review"
  );
}
