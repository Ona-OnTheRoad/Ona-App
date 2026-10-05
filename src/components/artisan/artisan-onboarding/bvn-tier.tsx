import { FileText } from "lucide-react";
import {
  canAccessBvn,
  lockMessageForSection,
} from "@/lib/artisan/verification-order";
import { cn } from "@/lib/utils";
import { reviewLabel } from "./helpers";
import { LockedTier } from "./locked-tier";
import { BvnSubmitLabel, bvnSubmitDisabled } from "./tier-labels";
import type { StepBaseProps } from "./types";

type Props = StepBaseProps & {
  hidden: boolean;
  embedInSheet: boolean;
  idBusy: "gov" | "nin" | null;
  setGatePopup: (message: string | null) => void;
  submitNinForReview: () => Promise<void>;
};

/** Tier 3 BVN (after Government ID; not part of T2) */
export function BvnTier({
  profile,
  patch,
  styles,
  hidden,
  embedInSheet,
  idBusy,
  setGatePopup,
  submitNinForReview,
}: Props) {
  const { ink, muted, panelClass, fieldClass } = styles;
  return (
    <LockedTier
      locked={!canAccessBvn(profile)}
      hidden={hidden}
      lockMessage={lockMessageForSection("bvn")}
      onLockedClick={() => setGatePopup(lockMessageForSection("bvn"))}
      panelClass={panelClass}
    >
      <p className={cn("flex items-center gap-2 text-[13px] font-bold", ink)}>
        <FileText className="h-4 w-4 shrink-0 text-[#FF6B35]" /> BVN · Tier 3
      </p>
      <p className={cn("mt-1 text-[10px] font-medium", muted)}>
        {profile.tiers.tier2_nin
          ? "Approved by admin / care"
          : reviewLabel(profile.ninReviewStatus)}
      </p>
      <input
        value={profile.nin || ""}
        onChange={(e) =>
          patch({
            nin: e.target.value.replace(/\D/g, "").slice(0, 11),
            tiers: { ...profile.tiers, tier2_nin: false },
            ninReviewStatus: "none",
          })
        }
        placeholder="11-digit BVN"
        className={cn("mt-2", fieldClass)}
        inputMode="numeric"
        maxLength={11}
        pattern="[0-9]{11}"
      />
      {!embedInSheet ? (
        <button
          type="button"
          disabled={bvnSubmitDisabled(profile, idBusy)}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md border-0 bg-[#323231] text-[13px] font-bold text-white disabled:opacity-60"
          onClick={submitNinForReview}
        >
          <BvnSubmitLabel profile={profile} idBusy={idBusy} />
        </button>
      ) : null}
    </LockedTier>
  );
}
