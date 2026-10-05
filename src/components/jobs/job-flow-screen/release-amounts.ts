import { buildCustomerChargeMajor, fromMinorUnits } from "@/lib/pricing";
import { payableCalloutMajor } from "@/lib/callout/payable";
import type { CalloutQuote } from "@/lib/callout/constants";
import type { JobRecord } from "@/lib/jobs/types";

/**
 * Call-out is added to collection and to the pro payout in full (not
 * split). Labour splits 87.5/5/7.5.
 */
export function computeReleaseAmounts(
  job: JobRecord,
  calloutQuote: CalloutQuote | null | undefined,
) {
  const releaseCalloutMajor = payableCalloutMajor(calloutQuote);
  const releaseLabourMajor =
    job.agreedMajor != null && job.agreedMajor > 0
      ? job.agreedMajor
      : job.amountMinor != null && job.amountMinor > 0
        ? Math.max(
            0,
            fromMinorUnits(job.amountMinor, job.currency) - releaseCalloutMajor,
          )
        : null;
  const releaseTotalMajor =
    releaseLabourMajor != null
      ? releaseLabourMajor + releaseCalloutMajor
      : null;
  const releaseSplit =
    releaseLabourMajor != null
      ? buildCustomerChargeMajor(releaseLabourMajor)
      : null;
  const releaseProMajor =
    releaseSplit != null
      ? releaseSplit.proPayoutMajor + releaseCalloutMajor
      : job.proPayoutMinor != null
        ? fromMinorUnits(job.proPayoutMinor, job.currency)
        : null;
  const releasePlatformMajor =
    releaseSplit != null
      ? releaseSplit.platformFeeMajor
      : job.platformFeeMinor != null
        ? fromMinorUnits(job.platformFeeMinor, job.currency)
        : null;
  const releaseVatMajor = releaseSplit != null ? releaseSplit.vatMajor : null;
  return {
    releaseTotalMajor,
    releaseProMajor,
    releasePlatformMajor,
    releaseVatMajor,
  };
}
