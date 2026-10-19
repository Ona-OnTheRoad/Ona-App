import type { ReactElement } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { onaEyebrowClass } from "@/components/ui/ona-field";
import type { CalloutQuote } from "@/lib/callout/constants";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { StarRow } from "./star-row";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  err: string | null;
  flash: string | null;
  calloutQuote: CalloutQuote | null | undefined;
  payoutPending: boolean;
  hasRating: boolean;
  alreadyLeft: boolean;
  displayRating: number;
  displayNote: string;
  rating: number;
  setRating: (n: number) => void;
  receiptOpen: boolean;
  setReceiptOpen: (fn: (o: boolean) => boolean) => void;
}

/** Step 2: payment released / job complete (+ receipt and review result). */
export function JobCompleteBody({
  job,
  viewer,
  err,
  flash,
  calloutQuote,
  payoutPending,
  hasRating,
  alreadyLeft,
  displayRating,
  displayNote,
  rating,
  setRating,
  receiptOpen,
  setReceiptOpen,
}: Props): ReactElement {
  return (
    <div className="flex flex-col items-center px-1 pt-10 text-center">
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full bg-ona-success-soft text-ona-success"
        aria-hidden
      >
        <Check className="h-9 w-9" strokeWidth={2} />
      </span>
      <p className={cn(onaEyebrowClass, "mt-8 text-ona-ink")}>
        {payoutPending ? "Payment confirmed" : "Payment released"}
      </p>
      <h1 className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
        You&apos;re back on the road.
      </h1>
      <p className="mt-2 max-w-[280px] text-[13px] leading-snug text-ona-muted">
        {payoutPending
          ? "Thanks, your payment is confirmed. Payout is processing."
          : "Thanks, payment released and job closed."}
      </p>
      <p className="mt-4 text-[12px] text-ona-muted">
        Thanks for choosing local help through Ona.
      </p>
      {job.agreedMajor != null ? (
        <div className="mt-4 w-full text-left">
          <JobChargeLines
            agreedMajor={job.agreedMajor}
            amountMinor={jobEscrowAmountMinor(job)}
            quote={calloutQuote ?? job.calloutQuote}
            fallbackQuote={job.calloutQuote}
            currency={job.currency}
            ink="text-ona-ink"
            muted="text-ona-muted"
            isLight
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setReceiptOpen((o) => !o)}
        aria-expanded={receiptOpen}
        className="mt-6 inline-flex items-center gap-1 border-0 bg-transparent px-0 text-[13px] font-semibold text-ona-ink"
      >
        Receipt
        {receiptOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {receiptOpen && (
        <div className="mt-2 space-y-1 text-[12px] font-medium text-ona-muted">
          <p>Ref {job.paymentReference || job.id}</p>
          <p>Escrow {job.escrowStatus || "released"}</p>
        </div>
      )}

      <div className="mt-8 w-full text-left">
        {hasRating || alreadyLeft ? (
          <>
            <p className={cn(onaEyebrowClass, "mb-3 text-center")}>
              {viewer === "repair_pro" ? "Customer rating" : "Your review"}
            </p>
            <StarRow
              value={displayRating}
              interactive={false}
              rating={rating}
              alreadyLeft={alreadyLeft}
              setRating={setRating}
            />
            {displayNote ? (
              <p className="mt-4 break-words rounded-ona-ctl bg-ona-field px-3 py-2.5 text-[13px] font-medium leading-snug text-ona-ink">
                “{displayNote}”
              </p>
            ) : viewer === "motorist" ? (
              <p className="mt-3 text-center text-[12px] font-semibold text-ona-muted">
                No written review
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-center text-[13px] font-semibold leading-snug text-ona-muted">
            {viewer === "repair_pro"
              ? "Waiting for the motorist to rate and review this job."
              : "Review saved."}
          </p>
        )}

        {flash && (
          <p
            role="status"
            className="mt-2 text-center text-[12px] font-semibold text-ona-brand-ink"
          >
            {flash}
          </p>
        )}
        {err && (
          <p
            role="alert"
            className="mt-2 text-center text-[12px] font-semibold text-ona-danger"
          >
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
