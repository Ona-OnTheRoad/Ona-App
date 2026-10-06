import type { ReactElement } from "react";
import { CopperButton } from "@/components/jobs/job-shell";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";

interface Props {
  viewer: JobViewer;
  muted: string;
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
  muted,
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
        <CopperButton disabled={busy || rating < 1} onClick={onSubmitReview}>
          {busy ? "Saving…" : "Submit review"}
        </CopperButton>
      ) : null}
      {canDisputeClosed ? (
        <button
          type="button"
          disabled={busy}
          onClick={onOpenDispute}
          className="w-full text-center text-[12px] font-bold text-red-500"
        >
          Open a dispute (48h window)
        </button>
      ) : null}
      {showJobComplete && viewer === "motorist" ? (
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-12 w-full items-center justify-center rounded-md border-0 bg-[#FF6B35] text-[14px] font-black text-white"
        >
          Done · Home
        </button>
      ) : null}
      {viewer === "repair_pro" ? (
        <button
          type="button"
          onClick={onPaymentStatus}
          className={cn("w-full text-center text-[12px] font-semibold", muted)}
        >
          Payment status
        </button>
      ) : null}
    </div>
  );
}
