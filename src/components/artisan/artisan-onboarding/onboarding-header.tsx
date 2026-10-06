import { PageHeader } from "@/components/layout/page-header";
import { statusLabel } from "@/lib/artisan/status";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import { cn } from "@/lib/utils";
import { STEPS } from "./constants";
import type { OnboardingStyles } from "./types";

type Props = {
  profile: ArtisanVerificationProfile;
  styles: OnboardingStyles;
  mode: "full" | "settings";
  embedInSheet: boolean;
  viewOnly: boolean;
  needsResubmit: boolean;
  waitingCareId: boolean;
  progress: number;
  stepIndex: number;
};

/** Page header, view-only / care banners and the step progress bar */
export function OnboardingHeader({
  profile,
  styles,
  mode,
  embedInSheet,
  viewOnly,
  needsResubmit,
  waitingCareId,
  progress,
  stepIndex,
}: Props) {
  const { isLight, ink, muted, soft } = styles;
  return (
    <div className="shrink-0">
      {!embedInSheet ? (
        <PageHeader
          title={
            viewOnly
              ? "View Verification"
              : mode === "settings"
                ? "Verification"
                : "Repair Pro Setup"
          }
          subtitle={
            viewOnly
              ? "View only"
              : `${statusLabel(profile.status)} · ${progress}% verified`
          }
          backHref={mode === "settings" ? "/settings" : "/dashboard"}
        />
      ) : null}
      {viewOnly ? (
        <p
          className={cn(
            "mx-3 mb-2 rounded-md px-3 py-2 text-[11px] font-medium",
            isLight ? "bg-black/5 text-slate-700" : "bg-white/10 text-white/70",
          )}
        >
          View only verification is complete. Contact Care to change documents.
        </p>
      ) : null}

      {needsResubmit ? (
        <div
          className={cn(
            "mx-3 mb-2 rounded-md border-0 px-3 py-2.5",
            isLight ? "bg-black/[0.05]" : "bg-white/[0.06]",
          )}
        >
          <p className={cn("text-[12px] font-bold", ink)}>
            Care asked you to re-verify
          </p>
          <p
            className={cn("mt-0.5 text-[11px] font-medium leading-snug", muted)}
          >
            {profile.rejectReason ||
              "Re-submit government ID and any skill documents below. You are not locked out."}
          </p>
        </div>
      ) : waitingCareId ? (
        <div
          className={cn(
            "mx-3 mb-2 rounded-md border-0 px-3 py-2.5",
            isLight ? "bg-black/[0.05]" : "bg-white/[0.06]",
          )}
        >
          <p className={cn("text-[12px] font-bold", ink)}>ID under review</p>
          <p
            className={cn("mt-0.5 text-[11px] font-medium leading-snug", muted)}
          >
            Ona Care is checking your details. You can still update other tiers.
            Go Live unlocks after T2 ID is approved.
          </p>
        </div>
      ) : null}

      {/* Progress full onboarding only */}
      {mode === "full" ? (
        <div className="px-3 pb-2">
          <div
            className={cn(
              "h-1 w-full overflow-hidden rounded-full",
              isLight ? "bg-black/10" : "bg-white/15",
            )}
          >
            <div
              className="h-full rounded-full bg-[#FF6B35] transition-all duration-300"
              style={{
                width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
          <p
            className={cn(
              "mt-2 text-[11px] font-semibold tracking-wide",
              muted,
            )}
          >
            {STEPS[stepIndex]?.label}{" "}
            <span className={cn("font-medium", soft)}>
              Step {stepIndex + 1} of {STEPS.length}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
