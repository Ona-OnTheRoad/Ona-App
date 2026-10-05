import type { ReactElement } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  CalloutFeeLines,
  JobChargeLines,
} from "@/components/jobs/callout-fee-lines";
import type { CalloutQuote } from "@/lib/callout/constants";
import {
  getDisplayTotalMajor,
  jobEscrowAmountMinor,
} from "@/lib/callout/payable";
import { paymentEndsAtIso } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { formatMoney, LABOUR_SPLIT_LINE_PRO } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  ink: string;
  muted: string;
  calloutQuote: CalloutQuote | null | undefined;
  showBreakdown: boolean;
  setShowBreakdown: (fn: (v: boolean) => boolean) => void;
}

/** Agreed price headline, charge lines, travel detail and pay-timer copy. */
export function AgreedPriceCard({
  job,
  viewer,
  isLight,
  ink,
  muted,
  calloutQuote,
  showBreakdown,
  setShowBreakdown,
}: Props): ReactElement {
  const payEndsAt = paymentEndsAtIso(job);
  return (
    <div className="mb-3 flex flex-col items-center py-3 text-center">
      <p className={cn("text-[26px] font-black tracking-tight", ink)}>
        {job.agreedMajor == null
          ? "Not set"
          : formatMoney(
              getDisplayTotalMajor({
                agreedMajor: job.agreedMajor,
                amountMinor: jobEscrowAmountMinor(job),
                quote: calloutQuote ?? job.calloutQuote,
                fallbackQuote: job.calloutQuote,
              }) ?? job.agreedMajor,
              job.currency,
            )}
      </p>
      {viewer === "repair_pro" ? (
        <p className={cn("mt-1 text-[12px] font-medium", muted)}>
          {LABOUR_SPLIT_LINE_PRO}
        </p>
      ) : job.agreedMajor != null ? (
        <p className={cn("mt-1 text-[12px] font-medium", muted)}>
          Service charge · pay exact amount
        </p>
      ) : null}
      {job.agreedMajor != null ? (
        <div
          className={cn(
            "mt-3 w-full rounded-xl px-3 py-3 text-left",
            isLight ? "bg-black/[0.04]" : "bg-white/[0.06]",
          )}
        >
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
          <p className={cn("mt-1.5 text-[10px] font-medium", muted)}>
            Labour + Call Out Fee
          </p>
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            className={cn(
              "mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold",
              isLight
                ? "bg-black/[0.06] text-slate-700"
                : "bg-white/[0.08] text-white/80",
            )}
            aria-expanded={showBreakdown}
          >
            {showBreakdown ? "Hide travel detail" : "Travel detail"}
            {showBreakdown ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          {showBreakdown ? (
            <div
              className={cn(
                "mt-3 border-t pt-3",
                isLight ? "border-black/10" : "border-white/10",
              )}
            >
              <CalloutFeeLines
                quote={calloutQuote ?? job.calloutQuote ?? null}
                currency={job.currency}
                ink={ink}
                muted={muted}
                compact
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {/*
  20-min pay timer lives only on checkout after Flutterwave opens.
  Pros never see a pay countdown only “waiting for customer”.
  */}
      {viewer === "motorist" && payEndsAt ? (
        <p className={cn("mt-3 text-center text-[12px] font-semibold", muted)}>
          Complete payment within 20 minutes in the checkout screen
        </p>
      ) : viewer === "repair_pro" ? (
        <p className={cn("mt-3 text-center text-[12px] font-semibold", muted)}>
          Waiting for customer to pay into escrow
        </p>
      ) : null}
    </div>
  );
}
