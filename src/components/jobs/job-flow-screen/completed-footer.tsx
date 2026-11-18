import type { ReactElement } from "react";
import { SwipeToRelease } from "@/components/jobs/motorist-release-pay-gate";
import type { FriendlyReleaseError } from "@/lib/jobs/release-messages";
import { ReleaseErrorBanner } from "./release-error-banners";

interface Props {
  showSatisfiedCta: boolean;
  payoutDone: boolean;
  isLight: boolean;
  busy: boolean;
  motoristActor: string;
  releaseError: FriendlyReleaseError | null;
  onDismissError: () => void;
  onSatisfied: () => void;
  onOpenDispute: () => void;
}

/** Completed footer: swipe-to-release for the customer, status for the pro. */
export function CompletedFooter({
  showSatisfiedCta,
  payoutDone,
  isLight,
  busy,
  motoristActor,
  releaseError,
  onDismissError,
  onSatisfied,
  onOpenDispute,
}: Props): ReactElement {
  return showSatisfiedCta ? (
    <div className="flex w-full flex-col gap-2">
      {releaseError ? (
        <ReleaseErrorBanner error={releaseError} onDismiss={onDismissError} />
      ) : null}
      {releaseError?.blocksRelease ? (
        // Swiping can't succeed until the pro fixes their bank details, so
        // offer a plain retry instead of a slider that is certain to fail.
        <button
          type="button"
          disabled={busy || !motoristActor}
          onClick={onSatisfied}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-full border-0 bg-ona-field text-[13px] font-bold text-ona-ink disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check again"}
        </button>
      ) : (
        <SwipeToRelease
          onRelease={onSatisfied}
          busy={busy || !motoristActor}
          isLight={isLight}
        />
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onOpenDispute}
        className="w-full text-center text-[12px] font-bold text-ona-danger"
      >
        Open a dispute
      </button>
      <p className="text-center text-[11px] font-medium text-ona-muted">
        Cannot close this job · auto-releases after 6 hours if no dispute
      </p>
    </div>
  ) : payoutDone ? (
    <p className="text-center text-[13px] font-semibold text-ona-muted">
      Released
    </p>
  ) : (
    <p className="text-center text-[13px] font-semibold text-ona-muted">
      Waiting for customer…
    </p>
  );
}
