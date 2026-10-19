import type { ReactElement } from "react";
import { CalloutFeeLines } from "@/components/jobs/callout-fee-lines";
import type { CalloutQuote } from "@/lib/callout/constants";
import { PhotoStrip } from "../job-flow/photo-strip";
import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import type { JobOffer, JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import { Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { cn, firstNameOnly } from "@/lib/utils";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  calloutQuote: CalloutQuote | null | undefined;
  theirOffer: JobOffer | undefined;
}

const CARD = "rounded-ona-card border border-ona-border bg-ona-surface p-4";
const EYEBROW =
  "text-[11px] font-semibold uppercase tracking-wide text-ona-muted";

/** Negotiate top block: matched pro, their latest offer, request details, history. */
export function NegotiationSummary({
  job,
  viewer,
  isLight,
  calloutQuote,
  theirOffer,
}: Props): ReactElement {
  const ink = "text-ona-ink";
  const muted = "text-ona-muted";
  const proKnown =
    !!job.repairProName && job.repairProName.trim() !== "Repair Pro";
  const proName = proKnown ? job.repairProName.trim() : "Repair Pro";
  const { technicians } = useApp();
  const tech = technicians.find((t) => t.id === job.repairProId);
  const done = tech?.jobsCompleted ?? 0;
  const stats = [
    done > 0
      ? `${done >= 10 ? `${Math.floor(done / 10) * 10}+` : done} Bookings`
      : null,
    tech && tech.rating > 0 ? `${tech.rating.toFixed(1)} rating` : null,
  ]
    .filter(Boolean)
    .join(" \u2022 ");
  const offerLabel =
    theirOffer?.side === "repair_pro"
      ? `${firstNameOnly(proName, "Repair Pro")}\u2019s labour offer`
      : "Customer\u2019s offer";

  return (
    <div className="shrink-0 space-y-3">
      {viewer === "motorist" && proKnown ? (
        <div className={cn(CARD, "flex items-center gap-3 py-3")}>
          <Avatar className="h-11 w-11">
            <AvatarImage src={job.repairProPhoto} alt="" />
            <AvatarFallback>{proName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-[15px] font-semibold", ink)}>
              {proName}
            </p>
            {stats ? (
              <p className={cn("truncate text-[12px]", muted)}>{stats}</p>
            ) : null}
          </div>
          <Badge
            variant="matched"
            role="status"
            className="shrink-0 border border-ona-success/40"
          >
            <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
            Matched
          </Badge>
        </div>
      ) : null}

      {theirOffer && (
        <div className={cn(CARD, "text-center")}>
          <p className={EYEBROW}>{offerLabel}</p>
          <p className={cn("mt-1 text-[30px] font-bold tabular-nums", ink)}>
            {formatMoney(theirOffer.amountMajor, job.currency)}
          </p>
          <p className={cn("mt-0.5 text-[12px]", muted)}>
            Parts, if needed, are approved separately
          </p>
        </div>
      )}

      {viewer === "repair_pro" ? (
        <>
          {isAutomotiveTrade(job.serviceType) ? (
            <div className={CARD}>
              <p className={EYEBROW}>Vehicle</p>
              <p className={cn("mt-1 text-[15px] font-semibold", ink)}>
                {job.motoristVehicle?.trim() || "Vehicle details on request"}
              </p>
            </div>
          ) : null}
          {calloutQuote ? (
            <div className={CARD}>
              <CalloutFeeLines
                quote={calloutQuote}
                currency={job.currency}
                ink={ink}
                muted={muted}
                compact
              />
            </div>
          ) : null}
        </>
      ) : (
        <>
          {job.voiceNote?.url && (
            <VoiceNotePlayer
              url={job.voiceNote.url}
              durationSec={job.voiceNote.durationSec}
              isLight={isLight}
              label="Your voice note"
            />
          )}
          {job.photos.length > 0 && (
            <div>
              <p className={cn(EYEBROW, "mb-1")}>Your photos</p>
              <PhotoStrip photos={job.photos} isLight={isLight} />
            </div>
          )}
        </>
      )}

      {/* The first offer is already the big card above; history only helps once there is a back-and-forth. */}
      {job.offers.length > 1 ? (
        <div className={CARD}>
          <p className={cn(EYEBROW, "mb-2")}>Offer history</p>
          <ul className="space-y-2">
            {job.offers.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 py-0.5"
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
