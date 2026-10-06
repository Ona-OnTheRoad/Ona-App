import {
  getDisplayTotalMajor,
  jobEscrowAmountMinor,
} from "@/lib/callout/payable";
import { formatMoney } from "@/lib/pricing";
import type { JobOffer, JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { formatWhenFull } from "./format-when";
import { hasReached, offerSideLabel } from "./request-detail-helpers";
import { formatWhenShort } from "./format-when";
import { DetailRow, Section } from "./request-detail-primitives";

export function RequestDealSections({
  job,
  isPro,
  offers,
  acceptedAt,
  paidAt,
  releasedAt,
  cancelledAt,
  calloutQuote,
  hairline,
  ink,
  muted,
}: {
  job: JobRecord;
  isPro: boolean;
  offers: JobOffer[];
  acceptedAt: string | null;
  paidAt: string | null | undefined;
  releasedAt: string | null | undefined;
  cancelledAt: string | null | undefined;
  calloutQuote: JobRecord["calloutQuote"] | null | undefined;
  hairline: string;
  ink: string;
  muted: string;
}) {
  return (
    <>
      <Section title="Acceptance & negotiation" muted={muted}>
        <DetailRow
          label="Opening price"
          value={
            job.proBaseMajor != null
              ? formatMoney(job.proBaseMajor, job.currency)
              : "Not set"
          }
          ink={ink}
          muted={muted}
        />
        {job.agreedMajor == null ? (
          <DetailRow
            label="Agreed price"
            value="Not agreed"
            ink={ink}
            muted={muted}
          />
        ) : null}
        <DetailRow
          label="Accepted at"
          value={acceptedAt ? formatWhenFull(acceptedAt) : "Not set"}
          ink={ink}
          muted={muted}
        />
        <DetailRow
          label="Offers"
          value={
            offers.length
              ? `${offers.length} of ${job.maxOffers || 6}`
              : "None recorded"
          }
          ink={ink}
          muted={muted}
        />

        {offers.length > 0 && (
          <ol className="mt-3 space-y-0 pt-2">
            {offers.map((o) => (
              <li
                key={o.id}
                className={cn(
                  "flex items-start justify-between gap-3 py-2",
                  hairline,
                )}
              >
                <div className="min-w-0">
                  <p className={cn("text-[13px] font-semibold", ink)}>
                    Offer {o.offerIndex} · {offerSideLabel(o.side, isPro)}
                  </p>
                  <p className={cn("mt-0.5 text-[11px] font-medium", muted)}>
                    {formatWhenShort(o.createdAt)}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-[14px] font-semibold tabular-nums",
                    ink,
                  )}
                >
                  {formatMoney(o.amountMajor, o.currency || job.currency)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Payment" muted={muted}>
        <DetailRow
          label="Paid & booked"
          value={
            paidAt || hasReached(job, "paid_booked")
              ? formatWhenFull(paidAt) || "Yes"
              : "Not paid"
          }
          ink={ink}
          muted={muted}
        />
        <DetailRow
          label="Escrow"
          value={job.escrowStatus || "Not set"}
          ink={ink}
          muted={muted}
        />
        {(getDisplayTotalMajor({
          agreedMajor: job.agreedMajor,
          amountMinor: jobEscrowAmountMinor(job),
          quote: calloutQuote ?? job.calloutQuote,
          fallbackQuote: job.calloutQuote,
        }) ?? (job.amountMinor != null ? job.amountMinor / 100 : null)) !=
          null && (
          <DetailRow
            label="Escrow total"
            value={formatMoney(
              getDisplayTotalMajor({
                agreedMajor: job.agreedMajor,
                amountMinor: jobEscrowAmountMinor(job),
                quote: calloutQuote ?? job.calloutQuote,
                fallbackQuote: job.calloutQuote,
              }) ?? (job.amountMinor != null ? job.amountMinor / 100 : 0),
              job.currency,
            )}
            ink={ink}
            muted={muted}
          />
        )}
        {job.proPayoutMinor != null && isPro && (
          <DetailRow
            label="Your payout"
            value={formatMoney(job.proPayoutMinor / 100, job.currency)}
            ink={ink}
            muted={muted}
          />
        )}
        <DetailRow
          label="Released"
          value={
            releasedAt || hasReached(job, "released")
              ? formatWhenFull(releasedAt) || "Yes"
              : "Not set"
          }
          ink={ink}
          muted={muted}
        />
        {cancelledAt && (
          <DetailRow
            label="Cancelled"
            value={formatWhenFull(cancelledAt)}
            ink={ink}
            muted={muted}
          />
        )}
      </Section>
    </>
  );
}
