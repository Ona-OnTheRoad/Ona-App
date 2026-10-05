import type { ReactElement } from "react";
import { SwipeToRelease } from "@/components/jobs/motorist-release-pay-gate";
import { cn } from "@/lib/utils";
import { ReleaseErrorFooterBanner } from "./release-error-banners";

interface Props {
  showSatisfiedCta: boolean;
  payoutDone: boolean;
  muted: string;
  isLight: boolean;
  busy: boolean;
  motoristActor: string;
  releaseBanner: string | null;
  showEgressHint: boolean;
  onCopyError: () => void;
  onDismissError: () => void;
  onSatisfied: () => void;
  onOpenDispute: () => void;
}

/** Completed footer: swipe-to-release for the customer, status for the pro. */
export function CompletedFooter({
  showSatisfiedCta,
  payoutDone,
  muted,
  isLight,
  busy,
  motoristActor,
  releaseBanner,
  showEgressHint,
  onCopyError,
  onDismissError,
  onSatisfied,
  onOpenDispute,
}: Props): ReactElement {
  return showSatisfiedCta ? (
    <div className="flex w-full flex-col gap-2">
      {releaseBanner ? (
        <ReleaseErrorFooterBanner
          message={releaseBanner}
          showEgressHint={showEgressHint}
          onCopy={onCopyError}
          onDismiss={onDismissError}
        />
      ) : null}
      <SwipeToRelease
        onRelease={onSatisfied}
        busy={busy || !motoristActor}
        isLight={isLight}
      />
      <button
        type="button"
        disabled={busy}
        onClick={onOpenDispute}
        className="w-full text-center text-[12px] font-bold text-red-500"
      >
        Open a dispute
      </button>
      <p className={cn("text-center text-[11px] font-medium", muted)}>
        Cannot close this job · auto-releases after 6 hours if no dispute
      </p>
    </div>
  ) : payoutDone ? (
    <p className={cn("text-center text-[13px] font-semibold", muted)}>
      Released
    </p>
  ) : (
    <p className={cn("text-center text-[13px] font-semibold", muted)}>
      Waiting for customer…
    </p>
  );
}
