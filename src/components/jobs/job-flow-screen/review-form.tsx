import type { ReactElement } from "react";
import { OnaTitle } from "@/components/ui/ona-screen";
import { onaEyebrowClass } from "@/components/ui/ona-field";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { REVIEW_MAX } from "./constants";
import { StarRow } from "./star-row";

interface Props {
  job: JobRecord;
  payoutPending: boolean;
  rating: number;
  setRating: (n: number) => void;
  reviewText: string;
  setReviewText: (v: string) => void;
  alreadyLeft: boolean;
}

/** Step 1: customer review (stars + text). */
export function ReviewForm({
  job,
  payoutPending,
  rating,
  setRating,
  reviewText,
  setReviewText,
  alreadyLeft,
}: Props): ReactElement {
  const reviewChars = reviewText.length;
  const proFirst = (job.repairProName || "").trim().split(/\s+/)[0];
  return (
    <div className="space-y-4 pt-3">
      <OnaTitle
        title="How was the job?"
        subtitle={`Rate your ${PRO_SERVICE_LABELS[job.serviceType] || "Repair Pro"} and leave a short review`}
      />
      {payoutPending ? (
        <p className="inline-block rounded-full bg-ona-brand-soft px-3 py-1.5 text-[11px] font-semibold text-ona-brand-ink">
          Payment confirmed · payout processing
        </p>
      ) : (
        <p className="inline-block rounded-full bg-ona-success-soft px-3 py-1.5 text-[11px] font-semibold text-ona-success">
          Payment released
        </p>
      )}
      <div className="rounded-ona-card border border-ona-border bg-ona-surface px-4 py-4">
        <p className={cn(onaEyebrowClass, "mb-3 text-center")}>
          {proFirst ? `How was ${proFirst}'s service?` : "Star rating"}
        </p>
        <StarRow
          value={rating}
          interactive
          rating={rating}
          alreadyLeft={alreadyLeft}
          setRating={setRating}
        />
      </div>
      <div>
        <label
          htmlFor="job-review-text"
          className="mb-1.5 block text-[13px] font-semibold text-ona-ink"
        >
          Review <span className="font-normal text-ona-muted">(optional)</span>
        </label>
        <textarea
          id="job-review-text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value.slice(0, REVIEW_MAX))}
          maxLength={REVIEW_MAX}
          rows={4}
          placeholder="Share your experience..."
          className="w-full resize-none rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 py-3 text-[13px] font-medium text-ona-ink outline-none transition-colors focus:border-ona-ink"
        />
        <p
          className={cn(
            "mt-1 text-right text-[11px] font-semibold tabular-nums",
            reviewChars >= REVIEW_MAX ? "text-ona-brand-ink" : "text-ona-muted",
          )}
        >
          {reviewChars}/{REVIEW_MAX}
        </p>
      </div>
    </div>
  );
}
