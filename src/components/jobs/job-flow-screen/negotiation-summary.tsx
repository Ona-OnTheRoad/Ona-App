import type { ReactElement } from "react";
import { CalloutFeeLines } from "@/components/jobs/callout-fee-lines";
import type { CalloutQuote } from "@/lib/callout/constants";
import { PhotoStrip } from "../job-flow/photo-strip";
import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import type { JobOffer, JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  ink: string;
  muted: string;
  calloutQuote: CalloutQuote | null | undefined;
  theirOffer: JobOffer | undefined;
}

/** Negotiate top block: request details, their latest offer, offer history. */
export function NegotiationSummary({
  job,
  viewer,
  isLight,
  ink,
  muted,
  calloutQuote,
  theirOffer,
}: Props): ReactElement {
  return (
    <div className="shrink-0 space-y-4 bg-transparent">
      {viewer === "repair_pro" ? (
        <div className="space-y-3 bg-transparent">
          {/* Pro request: vehicle details only the Q&A, matching skill
 and customer info were shown in the lower-panel card before
 accepting, so negotiation stays on the price. */}
          {isAutomotiveTrade(job.serviceType) ? (
            <div>
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide",
                  muted,
                )}
              >
                Vehicle
              </p>
              <p className={cn("mt-1 text-[15px] font-semibold", ink)}>
                {job.motoristVehicle?.trim() || "Vehicle details on request"}
              </p>
            </div>
          ) : null}
          {calloutQuote ? (
            <div>
              <CalloutFeeLines
                quote={calloutQuote}
                currency={job.currency}
                ink={ink}
                muted={muted}
                compact
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-transparent">
          {job.voiceNote?.url && (
            <div className="mt-2.5">
              <VoiceNotePlayer
                url={job.voiceNote.url}
                durationSec={job.voiceNote.durationSec}
                isLight={isLight}
                label="Your voice note"
              />
            </div>
          )}
          {job.photos.length > 0 && (
            <div className="mt-2.5">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide",
                  muted,
                )}
              >
                Your photos
              </p>
              <PhotoStrip photos={job.photos} isLight={isLight} />
            </div>
          )}
          {calloutQuote ? (
            <div className="mt-2.5">
              <CalloutFeeLines
                quote={calloutQuote}
                currency={job.currency}
                ink={ink}
                muted={muted}
                compact
              />
            </div>
          ) : null}
        </div>
      )}

      {theirOffer && (
        <div className="bg-transparent">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              muted,
            )}
          >
            {theirOffer.side === "repair_pro"
              ? "Repair Pro offered"
              : "Customer offered"}
          </p>
          <p
            className={cn("mt-0.5 text-[22px] font-semibold tabular-nums", ink)}
          >
            {formatMoney(theirOffer.amountMajor, job.currency)}
          </p>
          <p className={cn("mt-0.5 text-[12px] font-medium", muted)}>
            Labour only. Spare parts not included.
          </p>
        </div>
      )}

      {job.offers.length > 0 ? (
        <div className="bg-transparent">
          <p
            className={cn(
              "mb-1.5 text-[11px] font-semibold uppercase tracking-wide",
              muted,
            )}
          >
            Offer history
          </p>
          <ul className="space-y-2">
            {job.offers.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 bg-transparent py-0.5"
              >
                <span className={cn("text-[12px] font-medium", muted)}>
                  #{o.offerIndex}{" "}
                  {o.side === "repair_pro" ? "Repair Pro" : "Customer"}
                </span>
                <span
                  className={cn("text-[15px] font-semibold tabular-nums", ink)}
                >
                  {formatMoney(o.amountMajor, o.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
