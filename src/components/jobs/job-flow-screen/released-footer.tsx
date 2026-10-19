import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import type { JobViewer } from "./types";

interface Props {
  viewer: JobViewer;
  busy: boolean;
  rating: number;
  showReviewForm: boolean;
  showJobComplete: boolean;
  canDisputeClosed: boolean;
  onSubmitReview: () => void;
  onOpenDispute: () => void;
  onDone: () => void;
  onPaymentStatus: () => void;
}

/** Released/satisfied footer: submit review, dispute, done / payment status. */
export function ReleasedFooter({
  viewer,
  busy,
  rating,
  showReviewForm,
  showJobComplete,
  canDisputeClosed,
  onSubmitReview,
  onOpenDispute,
  onDone,
  onPaymentStatus,
}: Props): ReactElement {
  return (
    <div className="flex w-full flex-col gap-2">
      {showReviewForm ? (
        <Button
          variant="ona"
          size="ona"
          busy={busy}
          disabled={busy || rating < 1}
          onClick={onSubmitReview}
        >
          {busy ? "Saving…" : "Submit review"}
        </Button>
      ) : null}
      {showJobComplete && viewer === "motorist" ? (
        <Button variant="ona" size="ona" onClick={onDone}>
          Book another service
        </Button>
      ) : null}
      {canDisputeClosed ? (
        <button
          type="button"
          disabled={busy}
          onClick={onOpenDispute}
          className="w-full border-0 bg-transparent py-1 text-center text-[12px] font-semibold text-ona-danger"
        >
          Open a dispute (48h window)
        </button>
      ) : null}
      {viewer === "repair_pro" ? (
        <Button variant="onaGhost" size="ona" onClick={onPaymentStatus}>
          Payment status
        </Button>
      ) : null}
    </div>
  );
}
