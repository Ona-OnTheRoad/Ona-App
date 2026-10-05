import type { ReactNode } from "react";
import { Camera } from "lucide-react";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import {
  BvnSubmitLabel,
  bvnSubmitDisabled,
  skillSubmitDisabled,
  skillSubmitLabel,
} from "./tier-labels";

const FOOTER_BTN =
  "flex h-11 w-full items-center justify-center gap-2 rounded-md border-0 bg-[#323231] text-[13px] font-bold text-white disabled:opacity-60";

type Props = {
  profile: ArtisanVerificationProfile;
  sheetBg: string;
  viewOnly: boolean;
  busy: boolean;
  idBusy: "gov" | "nin" | null;
  showT2Form: boolean;
  showLivenessBtn: boolean;
  showBvnBtn: boolean;
  showSkillBtn: boolean;
  submitIdLabel: ReactNode;
  submitIdDisabled: boolean;
  submitGovIdForReview: () => Promise<void>;
  submitNinForReview: () => Promise<void>;
  submitSkillForReview: () => Promise<void>;
  onStartLiveness: () => void;
};

/** Sheet embed: primary action sticky at bottom (same for every tier) */
export function EmbedFooter({
  profile,
  sheetBg,
  viewOnly,
  busy,
  idBusy,
  showT2Form,
  showLivenessBtn,
  showBvnBtn,
  showSkillBtn,
  submitIdLabel,
  submitIdDisabled,
  submitGovIdForReview,
  submitNinForReview,
  submitSkillForReview,
  onStartLiveness,
}: Props) {
  return (
    <div
      className="shrink-0 border-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      style={{ backgroundColor: sheetBg }}
    >
      {showT2Form ? (
        <button
          type="button"
          disabled={submitIdDisabled || viewOnly}
          className={FOOTER_BTN}
          onClick={submitGovIdForReview}
        >
          {submitIdLabel}
        </button>
      ) : null}
      {showLivenessBtn ? (
        <button
          type="button"
          disabled={viewOnly}
          className={FOOTER_BTN}
          onClick={onStartLiveness}
        >
          <Camera className="h-4 w-4" />
          {profile.tiers.tier3_liveness
            ? "Run liveness again"
            : "Start face liveness"}
        </button>
      ) : null}
      {showBvnBtn ? (
        <button
          type="button"
          disabled={viewOnly || bvnSubmitDisabled(profile, idBusy)}
          className={FOOTER_BTN}
          onClick={submitNinForReview}
        >
          <BvnSubmitLabel profile={profile} idBusy={idBusy} />
        </button>
      ) : null}
      {showSkillBtn ? (
        <button
          type="button"
          disabled={viewOnly || skillSubmitDisabled(profile, busy)}
          className={FOOTER_BTN}
          onClick={() => void submitSkillForReview()}
        >
          {skillSubmitLabel(profile)}
        </button>
      ) : null}
    </div>
  );
}
