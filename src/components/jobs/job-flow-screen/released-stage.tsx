import type { ReactElement } from "react";
import { OnaScreen } from "@/components/ui/ona-screen";
import { apiOpenAppeal } from "@/lib/jobs/client";
import {
  canOpenDisputeNow,
  isPayoutPendingSettlement,
} from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { JobCompleteBody } from "./job-complete-body";
import { ReleasedFooter } from "./released-footer";
import { ReviewForm } from "./review-form";
import { createSubmitReview } from "./submit-review";
import type { JobFlowCtx } from "./use-job-flow-controller";

/** RELEASED / SATISFIED: customer review, then job completion. */
export function renderReleasedStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const {
    viewer,
    isLight,
    router,
    err,
    setErr,
    busy,
    setBusy,
    flash,
    setFlash,
    calloutQuote,
    goHome,
    commitJob,
    run,
    rating,
    setRating,
    reviewText,
    setReviewText,
    reviewLeft,
    setReviewLeft,
    receiptOpen,
    setReceiptOpen,
    setDisputeOpen,
  } = c;
  // Only motorist rates the Repair Pro. Both sides can view the result.
  const hasRating = job.rating != null && job.rating > 0;
  const alreadyLeft = reviewLeft || hasRating;
  const displayRating = hasRating ? Number(job.rating) : rating;
  const displayNote = (job.ratingNote || "").trim();
  const payoutPending =
    isPayoutPendingSettlement(job) && job.status !== "released";

  const submitReview = createSubmitReview({
    job,
    viewer,
    rating,
    reviewText,
    setErr,
    setBusy,
    setReviewLeft,
    setFlash,
    commitJob,
  });

  const canDisputeClosed = canOpenDisputeNow(job);
  /** Customer: stars + text first, then job completion ceremony. */
  const showReviewForm = viewer === "motorist" && !alreadyLeft;
  const showJobComplete = viewer === "motorist" ? alreadyLeft : true;

  return (
    <OnaScreen
      onBack={
        viewer === "repair_pro"
          ? () => router.replace("/settings/payments")
          : goHome
      }
      footer={
        <ReleasedFooter
          viewer={viewer}
          busy={busy}
          rating={rating}
          showReviewForm={showReviewForm}
          showJobComplete={showJobComplete}
          canDisputeClosed={canDisputeClosed}
          onSubmitReview={() => void submitReview()}
          onOpenDispute={() => setDisputeOpen(true)}
          onDone={() => router.replace("/dashboard")}
          onPaymentStatus={() => router.replace("/settings/payments")}
        />
      }
    >
      {/* ── Step 1: customer review (stars + text) ── */}
      {showReviewForm ? (
        <ReviewForm
          job={job}
          err={err}
          payoutPending={payoutPending}
          rating={rating}
          setRating={setRating}
          reviewText={reviewText}
          setReviewText={setReviewText}
          alreadyLeft={alreadyLeft}
        />
      ) : (
        /* ── Step 2: job completion / execution complete ── */
        <JobCompleteBody
          job={job}
          viewer={viewer}
          err={err}
          flash={flash}
          calloutQuote={calloutQuote}
          payoutPending={payoutPending}
          hasRating={hasRating}
          alreadyLeft={alreadyLeft}
          displayRating={displayRating}
          displayNote={displayNote}
          rating={rating}
          setRating={setRating}
          receiptOpen={receiptOpen}
          setReceiptOpen={setReceiptOpen}
        />
      )}

      {job.dispute?.decision && !job.dispute.appeal && (
        <button
          type="button"
          className="mt-8 w-full text-center text-[12px] font-bold text-ona-brand-ink"
          onClick={() =>
            void run(() =>
              apiOpenAppeal({
                jobId: job.id,
                by: viewer,
                reason: "I disagree with the dispute decision.",
              }),
            )
          }
        >
          Appeal decision (48h window)
        </button>
      )}
    </OnaScreen>
  );
}
