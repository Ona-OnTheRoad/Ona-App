import { saveArtisanProfile } from "@/lib/artisan/local-store";
import { canSubmitForReview } from "@/lib/artisan/status";
import {
  canAccessSkillProof,
  lockMessageForSection,
} from "@/lib/artisan/verification-order";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import { govIdNeedsBack } from "./helpers";
import type { OnboardingState } from "./use-onboarding-state";

type Params = {
  profile: ArtisanVerificationProfile | null;
  patch: OnboardingState["patch"];
  setProfile: OnboardingState["setProfile"];
  setBusy: OnboardingState["setBusy"];
  setIdBusy: OnboardingState["setIdBusy"];
  setMsg: OnboardingState["setMsg"];
  setErr: OnboardingState["setErr"];
  setGatePopup: OnboardingState["setGatePopup"];
};

const getAccessToken = async (): Promise<string | null> => {
  try {
    const { getAppSupabase } = await import("@/lib/supabase/app-client");
    const sb = getAppSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
};

const postProVerify = async (
  body: Record<string, unknown>,
): Promise<string | null> => {
  const token = await getAccessToken();
  if (!token) return "Sign in again to submit for review.";
  try {
    const res = await fetch("/api/verify/pro-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token, ...body }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
    } | null;
    if (!json?.ok) {
      return json?.error?.message || "Could not submit to server.";
    }
    return null;
  } catch {
    return "Network error submitting for review.";
  }
};

/** Submit-for-review actions (gov ID, skill proof, BVN, whole profile) */
export function useVerifyActions({
  profile,
  patch,
  setProfile,
  setBusy,
  setIdBusy,
  setMsg,
  setErr,
  setGatePopup,
}: Params) {
  /** Government ID: type + number + photo → server queue for admin/care */
  const submitGovIdForReview = async () => {
    if (!profile) return;
    if (!profile.govIdType) {
      setErr("Pick an ID type.");
      return;
    }
    if (!profile.govIdNumber?.trim() || profile.govIdNumber.trim().length < 5) {
      setErr("Enter the ID number.");
      return;
    }
    if (!profile.govIdFront?.url) {
      setErr(
        govIdNeedsBack(profile.govIdType)
          ? "Upload a clear photo of the front of the ID."
          : "Upload a clear photo of the selected ID.",
      );
      return;
    }
    if (govIdNeedsBack(profile.govIdType) && !profile.govIdBack?.url) {
      setErr("Upload a clear photo of the back of the ID.");
      return;
    }
    setIdBusy("gov");
    setErr(null);
    const apiErr = await postProVerify({
      kind: "gov_id",
      govIdKind: profile.govIdType,
      govIdNumber: profile.govIdNumber.trim(),
      govIdFrontUrl: profile.govIdFront.url,
      govIdBackUrl: govIdNeedsBack(profile.govIdType)
        ? profile.govIdBack?.url
        : undefined,
      primaryService: profile.trade?.service,
      businessName: profile.fullName,
    });
    if (apiErr) {
      setErr(apiErr);
      setIdBusy(null);
      return;
    }
    patch({
      tiers: { ...profile.tiers, tier2_govId: false },
      govIdReviewStatus: "submitted",
      govIdSubmittedAt: new Date().toISOString(),
    });
    setMsg(
      "Government ID submitted for review. Admin / customer care will approve it.",
    );
    setIdBusy(null);
  };

  /** NIN/BVN number → server queue for admin/care */
  const submitSkillForReview = async () => {
    if (!profile) return;
    if (!canAccessSkillProof(profile)) {
      setGatePopup(lockMessageForSection("skill"));
      return;
    }
    if (!profile.skillProof || !profile.skillProofType) {
      setErr("Upload a certificate first.");
      return;
    }
    setBusy(true);
    setErr(null);
    const apiErr = await postProVerify({
      kind: "skill_docs",
      skillProofType: profile.skillProofType,
      skillProofName: profile.skillProof?.name,
      skillProofUrl: profile.skillProof?.url,
      primaryService: profile.trade?.service,
    });
    if (apiErr) {
      setErr(apiErr);
      setBusy(false);
      return;
    }
    patch({
      skillProofStatus: "under_review",
      tiers: { ...profile.tiers, tier4_skillProof: true },
    });
    setMsg("Skill proof submitted for review.");
    setBusy(false);
  };

  const submitNinForReview = async () => {
    if (!profile) return;
    const nin = (profile.nin || "").replace(/\D/g, "");
    if (nin.length !== 11) {
      setErr("BVN must be exactly 11 digits.");
      return;
    }
    setIdBusy("nin");
    setErr(null);
    const apiErr = await postProVerify({ kind: "nin", nin });
    if (apiErr) {
      setErr(apiErr);
      setIdBusy(null);
      return;
    }
    patch({
      nin,
      tiers: { ...profile.tiers, tier2_nin: false },
      ninReviewStatus: "submitted",
      ninSubmittedAt: new Date().toISOString(),
    });
    setMsg("Submitted for review. Admin / customer care will verify it.");
    setIdBusy(null);
  };

  const submitReview = async () => {
    if (!profile) return;
    const gate = canSubmitForReview(profile);
    if (!gate.ok) {
      setErr(gate.reason);
      return;
    }
    setBusy(true);
    setErr(null);
    const apiErr = await postProVerify({
      kind: "profile_submit",
      primaryService: profile.trade?.service,
      businessName: profile.fullName,
    });
    if (apiErr) {
      setErr(apiErr);
      setBusy(false);
      return;
    }
    const next: ArtisanVerificationProfile = {
      ...profile,
      status: "pending_review",
      submittedAt: new Date().toISOString(),
      rejectReason: null,
    };
    saveArtisanProfile(next);
    setProfile(next);
    setMsg("Submitted for admin review. You cannot Go Live until approved.");
    setBusy(false);
  };

  return {
    submitGovIdForReview,
    submitSkillForReview,
    submitNinForReview,
    submitReview,
  };
}
