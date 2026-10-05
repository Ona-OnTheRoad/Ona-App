import type { ReactNode, RefObject } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { GovIdUploadSlots } from "./gov-id-upload-slots";
import { reviewLabel } from "./helpers";
import { IdTypeSelect } from "./id-type-select";
import type { FlashSetters, StepBaseProps } from "./types";

type Props = StepBaseProps &
  Pick<FlashSetters, "setErr" | "setBusy"> & {
    /** Hide the whole tier (customer T2 inherited, or another sheet tier active) */
    hidden: boolean;
    embedInSheet: boolean;
    idTypeWrapRef: RefObject<HTMLDivElement | null>;
    idTypeMenuOpen: boolean;
    setIdTypeMenuOpen: (next: boolean | ((o: boolean) => boolean)) => void;
    submitIdLabel: ReactNode;
    submitIdDisabled: boolean;
    submitGovIdForReview: () => Promise<void>;
  };

/** Tier 2 Government ID: type, number, photos, (page-only) submit */
export function GovIdTier({
  profile,
  patch,
  styles,
  setErr,
  setBusy,
  hidden,
  embedInSheet,
  idTypeWrapRef,
  idTypeMenuOpen,
  setIdTypeMenuOpen,
  submitIdLabel,
  submitIdDisabled,
  submitGovIdForReview,
}: Props) {
  const { ink, muted, panelClass, selectClass, fieldClass, isLight } = styles;
  return (
    <div className={cn(panelClass, "space-y-2.5", hidden && "hidden")}>
      <div>
        <p className={cn("flex items-center gap-2 text-[13px] font-bold", ink)}>
          <FileText className="h-4 w-4 shrink-0 text-[#FF6B35]" /> Government ID
        </p>
        <p className={cn("mt-1 text-[10px] font-medium", muted)}>
          {profile.tiers.tier2_govId
            ? "Approved by admin / care"
            : reviewLabel(profile.govIdReviewStatus)}
        </p>
      </div>
      <IdTypeSelect
        profile={profile}
        patch={patch}
        wrapRef={idTypeWrapRef}
        open={idTypeMenuOpen}
        setOpen={setIdTypeMenuOpen}
        selectClass={selectClass}
        isLight={isLight}
      />
      <input
        value={profile.govIdNumber || ""}
        onChange={(e) => {
          let v = e.target.value;
          if (profile.govIdType === "nin") {
            v = v.replace(/\D/g, "").slice(0, 11);
          }
          patch({
            govIdNumber: v,
            tiers: { ...profile.tiers, tier2_govId: false },
            govIdReviewStatus: "none",
          });
        }}
        placeholder={
          profile.govIdType === "nin"
            ? "11-digit NIN"
            : "ID number on the document"
        }
        className={fieldClass}
        inputMode={profile.govIdType === "nin" ? "numeric" : "text"}
        maxLength={profile.govIdType === "nin" ? 11 : undefined}
        disabled={
          profile.tiers.tier2_govId || profile.govIdReviewStatus === "submitted"
        }
      />
      <GovIdUploadSlots
        profile={profile}
        patch={patch}
        styles={styles}
        setErr={setErr}
        setBusy={setBusy}
      />
      {/* Full page: inline submit. Sheet embed: sticky footer below. */}
      {!embedInSheet ? (
        <button
          type="button"
          disabled={submitIdDisabled}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border-0 bg-[#323231] text-[12px] font-bold text-white disabled:opacity-60"
          onClick={submitGovIdForReview}
        >
          {submitIdLabel}
        </button>
      ) : null}
    </div>
  );
}
