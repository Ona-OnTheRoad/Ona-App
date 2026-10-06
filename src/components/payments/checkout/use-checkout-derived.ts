"use client";

import { useMemo } from "react";
import {
  MAX_PAYMENT_ATTEMPTS,
  paymentAttemptsRemaining,
  paymentEndsAtIso,
} from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { forceNairaCurrency, formatMoney } from "@/lib/pricing";
import { useJobCallout } from "@/lib/callout/use-job-callout";
import { jobChargeParts, jobEscrowAmountMinor } from "@/lib/callout/payable";

export function useCheckoutDerived(
  job: JobRecord | null,
  sessionEndsAt: string | null,
) {
  const { quote: calloutQuote } = useJobCallout(
    job?.id,
    job?.status,
    job?.calloutQuote,
  );

  const agreedMajor = job?.agreedMajor ?? null;
  const chargeParts = useMemo(
    () =>
      jobChargeParts({
        agreedMajor,
        amountMinor: jobEscrowAmountMinor(job),
        quote: calloutQuote,
        fallbackQuote: job?.calloutQuote,
      }),
    [agreedMajor, calloutQuote, job],
  );

  const amountLabel = useMemo(() => {
    if (!chargeParts) return "Not set";
    return formatMoney(
      chargeParts.totalMajor,
      forceNairaCurrency(job?.currency),
    );
  }, [chargeParts, job?.currency]);

  const payEndsAt = useMemo(() => {
    if (sessionEndsAt) return sessionEndsAt;
    if (!job) return null;
    return paymentEndsAtIso(job);
  }, [job, sessionEndsAt]);

  const attemptsLeft = job
    ? paymentAttemptsRemaining(job)
    : MAX_PAYMENT_ATTEMPTS;
  const hasOpenSession = Boolean(payEndsAt);

  return {
    calloutQuote,
    agreedMajor,
    chargeParts,
    amountLabel,
    payEndsAt,
    attemptsLeft,
    hasOpenSession,
  };
}
