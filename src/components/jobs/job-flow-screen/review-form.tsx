import type { ReactElement } from "react";
import { REVIEW_MAX } from "./constants";
import { StarRow } from "./star-row";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";

interface Props {
  job: JobRecord;
  isLight: boolean;
  ink: string;
  muted: string;
  err: string | null;
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
  isLight,
  ink,
  muted,
  err,
  payoutPending,
  rating,
  setRating,
  reviewText,
  setReviewText,
  alreadyLeft,
}: Props): ReactElement {
  const reviewChars = reviewText.length;
  return (
    <div className="flex flex-col items-center px-2 pt-5 text-center">
      <p className={cn("text-[20px] font-black tracking-tight", ink)}>
        How was the job?
      </p>
      <p className={cn("mt-1.5 text-[13px] font-medium leading-snug", muted)}>
        Rate your {PRO_SERVICE_LABELS[job.serviceType] || "Repair Pro"} and
        leave a short review
      </p>
      {payoutPending ? (
        <p className="mt-3 rounded-md bg-[#FF6B35]/15 px-3 py-1.5 text-[11px] font-bold text-[#FF6B35]">
          Payment confirmed · payout processing
        </p>
      ) : (
        <p className="mt-3 rounded-md bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-600">
          Payment released
        </p>
      )}
      <div className="mt-8 w-full max-w-md text-left">
        <p className={cn("mb-3 text-center text-[14px] font-bold", ink)}>
          Star rating
        </p>
        <StarRow
          value={rating}
          interactive
          isLight={isLight}
          rating={rating}
          alreadyLeft={alreadyLeft}
          setRating={setRating}
        />
        <div className="mt-5">
          <label
            htmlFor="job-review-text"
            className={cn("mb-1.5 block text-[12px] font-bold", ink)}
          >
            Write a review
          </label>
          <textarea
            id="job-review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value.slice(0, REVIEW_MAX))}
            maxLength={REVIEW_MAX}
            rows={4}
            placeholder="How was the repair? (optional)"
            className={cn(
              "w-full resize-none rounded-md border-0 px-3 py-2.5 text-[13px] font-medium outline-none ring-1 transition placeholder:opacity-50",
              isLight
                ? "bg-transparent text-slate-900 ring-black/15 focus:ring-[#FF6B35]/50"
                : "bg-transparent text-white ring-white/20 focus:ring-[#FF6B35]/50",
            )}
          />
          <p
            className={cn(
              "mt-1 text-right text-[11px] font-semibold tabular-nums",
              reviewChars >= REVIEW_MAX ? "text-[#FF6B35]" : muted,
            )}
          >
            {reviewChars}/{REVIEW_MAX}
          </p>
        </div>
        {err && (
          <p className="mt-3 text-center text-[12px] font-semibold text-red-500">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
