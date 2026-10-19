"use client";

import { Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { forceNairaCurrency } from "@/lib/pricing";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";
import { isJobPayable } from "../shared/job-status";
import type { CheckoutTone } from "./types";

type ChargeLinesProps = Parameters<typeof JobChargeLines>[0];

export function SummaryView({
  tone,
  job,
  amountLabel,
  chargeParts,
  agreedMajor,
  calloutQuote,
  err,
  onPay,
}: {
  tone: CheckoutTone;
  job: JobRecord | null;
  amountLabel: string;
  chargeParts: unknown;
  agreedMajor: number | null;
  calloutQuote: ChargeLinesProps["quote"];
  err: string | null;
  onPay: () => void;
}) {
  const { card, ink, muted } = tone;
  const cancelled = job?.status === "cancelled" || job?.status === "expired";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 scrollbar-hide">
        <p className={cn("text-[13px] leading-snug", muted)}>
          Payment is held safely and only released when you confirm the job is
          complete.
        </p>

        {/* Payment method: bank transfer only (USSD and others disabled) */}
        <div className={cn("mt-4 rounded-ona-card p-4", card)}>
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              muted,
            )}
          >
            Payment method
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-ona-brand-btn text-white"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className={cn("text-[13px] font-semibold", ink)}>
                Bank transfer
              </p>
              <p className={cn("text-[12px]", muted)}>
                Pay in-app with a one-time account number
              </p>
            </div>
          </div>
        </div>

        {/* Booking summary (dark card) */}
        <div className="mt-3 rounded-ona-card bg-ona-dark p-4 text-ona-on-dark">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ona-on-dark-muted">
            Booking summary
          </p>
          <p className="mt-1 text-[30px] font-bold tabular-nums tracking-tight">
            {amountLabel}
          </p>
          {chargeParts ? (
            <div className="mt-3">
              <JobChargeLines
                agreedMajor={agreedMajor}
                amountMinor={jobEscrowAmountMinor(job)}
                quote={calloutQuote}
                fallbackQuote={job?.calloutQuote}
                currency={forceNairaCurrency(job?.currency)}
                ink="text-ona-on-dark"
                muted="text-ona-on-dark-muted"
                compact
                isLight={false}
              />
              <p className="pt-2 text-[11px] leading-snug text-ona-on-dark-muted">
                Pay this exact amount only. Your bank may add its own transfer
                fee. Do not change the transfer amount.
              </p>
            </div>
          ) : null}
        </div>

        {/* Job summary */}
        <div className={cn("mt-3 rounded-ona-card px-4 py-3.5", card)}>
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              muted,
            )}
          >
            Booking
          </p>
          {!job ? (
            <div className="mt-3 flex justify-center py-4">
              <Loader2
                aria-label="Loading booking"
                className="h-6 w-6 animate-spin text-ona-brand motion-reduce:animate-none"
              />
            </div>
          ) : (
            <dl className="mt-2 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className={muted}>Repair Pro</dt>
                <dd className={cn("truncate font-semibold", ink)}>
                  {job.repairProName}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={muted}>Service</dt>
                <dd className={cn("font-semibold", ink)}>
                  {PRO_SERVICE_LABELS[job.serviceType] || job.serviceType}
                </dd>
              </div>
              {isAutomotiveTrade(job.serviceType) && job.motoristVehicle ? (
                <div className="flex justify-between gap-3">
                  <dt className={muted}>Vehicle</dt>
                  <dd className={cn("truncate font-semibold", ink)}>
                    {job.motoristVehicle}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>

        {err ? (
          <p
            role="alert"
            className="mt-3 text-center text-[12px] font-semibold text-ona-danger"
          >
            {err}
          </p>
        ) : null}
      </div>

      {/* Pay bar pinned to the bottom of the page */}
      <div className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <Button
          variant="ona"
          size="ona"
          disabled={!job || !isJobPayable(job)}
          onClick={onPay}
        >
          <Lock className="h-4 w-4" />
          {cancelled
            ? "Pay again"
            : amountLabel
              ? `Pay ${amountLabel} securely`
              : "Pay securely"}
        </Button>
      </div>
    </div>
  );
}
