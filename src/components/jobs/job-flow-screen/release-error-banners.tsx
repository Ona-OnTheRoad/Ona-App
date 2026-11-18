import type { ReactElement } from "react";
import type { FriendlyReleaseError } from "@/lib/jobs/release-messages";

/**
 * The single release-error banner. One failure, one message, in plain words.
 * (There used to be two near-identical banners, one in the card and one in the
 * footer, both showing the raw server text with a "Copy error" button.)
 */
export function ReleaseErrorBanner({
  error,
  onDismiss,
}: {
  error: FriendlyReleaseError;
  onDismiss: () => void;
}): ReactElement {
  return (
    <div
      className="z-20 max-h-48 overflow-y-auto rounded-ona-ctl border border-ona-danger/40 bg-ona-surface px-3 py-2.5 text-left"
      role="alert"
    >
      <p className="text-[12px] font-semibold leading-snug text-ona-danger">
        {error.message}
      </p>
      {error.blocksRelease ? null : (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 min-h-8 rounded-md border-0 bg-ona-field px-2.5 py-1 text-[11px] font-bold text-ona-danger"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
