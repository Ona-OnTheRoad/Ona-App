import type { RefObject } from "react";
import { Upload } from "lucide-react";
import { UploadInlinePreview } from "@/components/media/upload-inline-preview";
import type { SkillProofType } from "@/lib/artisan/types";
import { IMAGE_MAX_BYTES } from "@/lib/artisan/types";
import {
  canAccessSkillProof,
  lockMessageForSection,
} from "@/lib/artisan/verification-order";
import { cn } from "@/lib/utils";
import { imageFileToDataUrl, formatMb, uid } from "./helpers";
import { LockedTier } from "./locked-tier";
import { skillSubmitDisabled, skillSubmitLabel } from "./tier-labels";
import type { FlashSetters, StepBaseProps } from "./types";

type Props = StepBaseProps &
  FlashSetters & {
    hidden: boolean;
    embedInSheet: boolean;
    busy: boolean;
    skillSectionRef: RefObject<HTMLDivElement | null>;
    setGatePopup: (message: string | null) => void;
    submitSkillForReview: () => Promise<void>;
  };

/** Tier 4 proof of skill (after BVN + liveness) */
export function SkillTier({
  profile,
  patch,
  styles,
  setErr,
  setMsg,
  setBusy,
  hidden,
  embedInSheet,
  busy,
  skillSectionRef,
  setGatePopup,
  submitSkillForReview,
}: Props) {
  const { ink, muted, panelClass, selectClass, isLight } = styles;
  return (
    <LockedTier
      wrapRef={skillSectionRef}
      locked={!canAccessSkillProof(profile)}
      hidden={hidden}
      lockMessage={lockMessageForSection("skill")}
      onLockedClick={() => setGatePopup(lockMessageForSection("skill"))}
      panelClass={panelClass}
      innerClassName="space-y-2.5"
    >
      <div>
        <p className={cn("text-[13px] font-bold", ink)}>Proof of skill</p>
        <p className={cn("mt-1 text-[10px] font-medium", muted)}>
          {profile.skillProof
            ? profile.skillProofStatus === "under_review" ||
              profile.tiers.tier4_skillProof
              ? "Submitted for review"
              : `Ready: ${profile.skillProof.name || "file"}`
            : "Upload certificate, then submit for review"}
        </p>
      </div>
      <select
        value={profile.skillProofType || ""}
        onChange={(e) =>
          patch({
            skillProofType: (e.target.value || null) as SkillProofType | null,
          })
        }
        className={selectClass}
      >
        <option value="">Certificate type…</option>
        <option value="trade_test">Trade Test</option>
        <option value="nabteb">NABTEB</option>
        <option value="itf">ITF</option>
        <option value="apprenticeship_letter">Apprenticeship letter</option>
        <option value="other_evidence">Other evidence</option>
      </select>
      <div className="space-y-1.5">
        <label
          className={cn(
            "flex w-full min-h-[48px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md px-3 py-3",
            isLight
              ? "bg-black/[0.06] text-slate-800"
              : "bg-white/[0.08] text-white",
          )}
        >
          <span className="flex items-center gap-2 text-[12px] font-bold">
            <Upload className="h-4 w-4 shrink-0 text-[#FF6B35]" />
            {profile.skillProof
              ? `File: ${profile.skillProof.name || "certificate"}`
              : "Upload certificate"}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (!canAccessSkillProof(profile)) {
                setGatePopup(lockMessageForSection("skill"));
                return;
              }
              if (!profile.skillProofType) {
                setErr("Pick a certificate type first.");
                return;
              }
              if (f.type.startsWith("image/") && f.size > IMAGE_MAX_BYTES) {
                setErr(`Image must be ${formatMb(IMAGE_MAX_BYTES)} or less.`);
                return;
              }
              setBusy(true);
              try {
                const url = await imageFileToDataUrl(f);
                // Draft only submit button sends for review
                patch({
                  skillProof: {
                    id: uid(),
                    url,
                    kind: "skill_proof",
                    name: f.name,
                    mime: f.type,
                    createdAt: new Date().toISOString(),
                  },
                  skillProofStatus: "uploaded",
                  tiers: {
                    ...profile.tiers,
                    tier4_skillProof: false,
                  },
                });
                setMsg("Certificate saved. Submit for review below.");
                setErr(null);
              } catch {
                setErr("Could not read file.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {profile.skillProof?.url ? (
          <UploadInlinePreview
            url={profile.skillProof.url}
            label="Skill proof"
            mime={profile.skillProof.mime}
            fileName={profile.skillProof.name}
            isLight={isLight}
            defaultOpen
          />
        ) : null}
      </div>
      {!embedInSheet ? (
        <button
          type="button"
          disabled={skillSubmitDisabled(profile, busy)}
          className="flex h-11 w-full items-center justify-center rounded-md border-0 bg-[#323231] text-[13px] font-bold text-white disabled:opacity-60"
          onClick={() => {
            void submitSkillForReview();
          }}
        >
          {skillSubmitLabel(profile)}
        </button>
      ) : null}
    </LockedTier>
  );
}
