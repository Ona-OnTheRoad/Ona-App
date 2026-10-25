import { Loader2 } from "lucide-react";
import { INCOMING_POPUP_VISIBLE_SEC } from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarInitials } from "@/lib/brand";
import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { JobProblemQA } from "@/components/jobs/job-problem-qa";
import { cn } from "@/lib/utils";
import { CalloutFeeOnCard } from "./callout-fee-on-card";
import { isPairingAlert, jobTitle } from "./helpers";
import type { LightboxState, PanelLevel } from "./types";

interface IncomingCardProps {
  job: JobRecord;
  level: PanelLevel;
  isLight: boolean;
  ink: string;
  timeLeft: number;
  acceptingId: string | null;
  backendUserId: string | null | undefined;
  onOpenPhotos: (lb: LightboxState) => void;
  onDecline: (job: JobRecord) => void;
  onConfirm: (job: JobRecord) => void;
}

/** One request card inside the lower panel (no border; gap-only separation). */
export function IncomingCard({
  job,
  level,
  isLight,
  ink,
  timeLeft,
  acceptingId,
  backendUserId,
  onOpenPhotos,
  onDecline,
  onConfirm,
}: IncomingCardProps) {
  const pairingCard = isPairingAlert(job);
  const accepting = acceptingId === job.id;
  const strip = job.photos?.length > 0 ? job.photos : [];
  return (
    <div className="shrink-0 rounded-xl p-2.5" style={{ border: "none" }}>
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 shrink-0 rounded-full">
          {job.motoristPhoto?.trim() ? (
            <AvatarImage
              src={job.motoristPhoto.trim()}
              alt=""
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-brand text-[10px] font-bold text-white">
            {avatarInitials(job.motoristName || "Motorist")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[14px] font-black leading-tight"
            style={{ color: ink }}
          >
            {jobTitle(job)}
          </p>
          {job.agreedMajor != null ? (
            <div className="mt-1">
              <JobChargeLines
                agreedMajor={job.agreedMajor}
                amountMinor={jobEscrowAmountMinor(job)}
                quote={job.calloutQuote}
                fallbackQuote={job.calloutQuote}
                currency={job.currency}
                ink={isLight ? "text-slate-900" : "text-white"}
                muted={isLight ? "text-slate-500" : "text-white/50"}
                compact
                isLight={isLight}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2">
        <JobProblemQA
          problem={job.problem}
          isLight={isLight}
          transparent
          hideVehicleRow
          pageSize={level === "full" ? undefined : 2}
        />
      </div>
      {job.voiceNote?.url ? (
        <div className="mt-2">
          <VoiceNotePlayer
            url={job.voiceNote.url}
            durationSec={job.voiceNote.durationSec}
            isLight={isLight}
          />
        </div>
      ) : null}
      {strip.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {strip.slice(0, 4).map((p, i) => (
            <button
              key={p.id || `photo-${job.id}-${i}`}
              type="button"
              aria-label={p.name || "View job photo"}
              onClick={() =>
                onOpenPhotos({
                  photos: strip,
                  index: i,
                })
              }
              className="h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-md border-0 p-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.name || "Job photo"}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </button>
          ))}
        </div>
      ) : null}

      <CalloutFeeOnCard job={job} isLight={isLight} />

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          disabled={!!acceptingId}
          onClick={() => onDecline(job)}
          className={cn(
            "h-11 flex-1 rounded-xl border-0 text-[13px] font-bold",
            isLight
              ? "bg-red-500/15 text-red-700"
              : "bg-red-500/20 text-red-400",
          )}
        >
          Decline
        </button>
        <button
          type="button"
          disabled={!!acceptingId || !backendUserId}
          onClick={() => onConfirm(job)}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border-0 bg-[#FF6B35] text-[14px] font-bold text-white"
        >
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}I can
          fix this
        </button>
      </div>

      {pairingCard && !job.pairingDeadline ? null : (
        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={INCOMING_POPUP_VISIBLE_SEC}
          aria-valuenow={timeLeft}
          aria-label="Time remaining for this request"
        >
          <div
            className="h-full bg-[#FF6B35] transition-[width] duration-1000 ease-linear"
            style={{
              width: `${Math.max(
                0,
                Math.min(100, (timeLeft / INCOMING_POPUP_VISIBLE_SEC) * 100),
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
