import type { ReactElement } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import type { CalloutQuote } from "@/lib/callout/constants";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { StarRow } from "./star-row";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  ink: string;
  muted: string;
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

/** Step 2: job completion / execution complete (+ receipt and review result). */
export function JobCompleteBody({
  job,
  viewer,
  isLight,
  ink,
  muted,
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
    <div className="flex flex-col items-center px-2 pt-6 text-center">
      <CheckCircle2
        className="h-14 w-14 text-emerald-500"
        strokeWidth={1.75}
        aria-hidden
      />
      <p className={cn("mt-4 text-[22px] font-black tracking-tight", ink)}>
        Job complete
      </p>
      <p className={cn("mt-1.5 text-[13px] font-medium leading-snug", muted)}>
        {payoutPending
          ? "Thanks your payment is confirmed. Payout is processing."
          : "Thanks payment released and job closed."}
      </p>
      {job.agreedMajor != null ? (
        <div className="mt-3 w-full text-left">
          <JobChargeLines
            agreedMajor={job.agreedMajor}
            amountMinor={jobEscrowAmountMinor(job)}
            quote={calloutQuote ?? job.calloutQuote}
            fallbackQuote={job.calloutQuote}
            currency={job.currency}
            ink={ink}
            muted={muted}
            isLight={isLight}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setReceiptOpen((o) => !o)}
        className={cn(
          "mt-6 inline-flex items-center gap-1 border-0 bg-transparent px-0 text-[13px] font-bold",
          isLight ? "text-slate-800" : "text-white",
        )}
      >
        Receipt
        {receiptOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {receiptOpen && (
        <div className={cn("mt-2 space-y-1 text-[12px] font-medium", muted)}>
          <p>Ref {job.paymentReference || job.id}</p>
          <p>Escrow {job.escrowStatus || "released"}</p>
        </div>
      )}

      <div className="mt-10 w-full max-w-md text-left">
        {hasRating || alreadyLeft ? (
          <>
            <p className={cn("mb-3 text-center text-[14px] font-bold", ink)}>
              {viewer === "repair_pro" ? "Customer rating" : "Your review"}
            </p>
            <StarRow
              value={displayRating}
              interactive={false}
              isLight={isLight}
              rating={rating}
              alreadyLeft={alreadyLeft}
              setRating={setRating}
            />
            {displayNote ? (
              <p
                className={cn(
                  "mt-4 rounded-md px-3 py-2.5 text-[13px] font-medium leading-snug break-words",
                  isLight
                    ? "bg-[#bebfc4]/60 text-slate-900"
                    : "bg-[#1a1a1a] text-white/90",
                )}
              >
                “{displayNote}”
              </p>
            ) : viewer === "motorist" ? (
              <p
                className={cn(
                  "mt-3 text-center text-[12px] font-semibold",
                  muted,
                )}
              >
                No written review
              </p>
            ) : null}
          </>
        ) : (
          <p
            className={cn(
              "text-center text-[13px] font-semibold leading-snug",
              muted,
            )}
          >
            {viewer === "repair_pro"
              ? "Waiting for the motorist to rate and review this job."
              : "Review saved."}
          </p>
        )}

        {flash && (
          <p className="mt-2 text-center text-[12px] font-bold text-[#FF6B35]">
            {flash}
          </p>
        )}
        {err && (
          <p className="mt-2 text-center text-[12px] font-semibold text-red-500">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
