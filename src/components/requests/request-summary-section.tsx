import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { formatWhenFull } from "./format-when";
import { statusLabel } from "./request-detail-helpers";
import { DetailRow, Section } from "./request-detail-primitives";

export function RequestSummarySection({
  job,
  counterpart,
  skill,
  calloutQuote,
  isLight,
  ink,
  muted,
}: {
  job: JobRecord;
  counterpart: string;
  skill: string;
  calloutQuote: JobRecord["calloutQuote"] | null | undefined;
  isLight: boolean;
  ink: string;
  muted: string;
}) {
  return (
    <>
      <Section title="Summary" muted={muted}>
        <p className={cn("text-[17px] font-semibold", ink)}>{counterpart}</p>
        <p className={cn("mt-0.5 text-[12px] font-medium", muted)}>
          {skill}
          {isAutomotiveTrade(job.serviceType) && job.motoristVehicle
            ? ` · ${job.motoristVehicle}`
            : ""}
        </p>
        <p className={cn("mt-3 text-[14px] font-medium leading-relaxed", ink)}>
          {job.problem}
        </p>
        {job.locationLabel?.trim() && (
          <p className={cn("mt-2 text-[12px] font-medium leading-snug", muted)}>
            {job.locationLabel}
          </p>
        )}
        {job.agreedMajor != null ? (
          <div className="mt-3">
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
        <div className="mt-2 pt-1">
          <DetailRow
            label="Status"
            value={statusLabel(job.status)}
            ink={ink}
            muted={muted}
          />
          <DetailRow
            label="Requested"
            value={formatWhenFull(job.createdAt)}
            ink={ink}
            muted={muted}
          />
          <DetailRow
            label="Updated"
            value={formatWhenFull(job.updatedAt)}
            ink={ink}
            muted={muted}
          />
          {job.paymentReference && (
            <DetailRow
              label="Payment ref"
              value={job.paymentReference}
              ink={ink}
              muted={muted}
            />
          )}
        </div>
      </Section>

      {/* Evidence media */}
      {(job.photos?.length > 0 || job.voiceNote) && (
        <Section title="Request media" muted={muted}>
          {job.voiceNote?.url && (
            <div className="mb-3">
              <p className={cn("mb-1.5 text-[12px] font-medium", muted)}>
                Voice note
              </p>
              <VoiceNotePlayer
                url={job.voiceNote.url}
                durationSec={job.voiceNote.durationSec}
                isLight={isLight}
              />
            </div>
          )}
          {job.photos?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  loading="lazy"
                  decoding="async"
                  key={p.id}
                  src={p.url}
                  alt={p.name || "Job photo"}
                  className="h-20 w-20 rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </Section>
      )}
    </>
  );
}
