import type { ReactElement } from "react";
import { CopperButton, StageButton } from "@/components/jobs/job-shell";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { ChatEndedDialog } from "./shared-pieces";
import type { JobViewer, TripEvent } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  tradeLabel: string;
  showMap: boolean;
  busy: boolean;
  err: string | null;
  flash: string | null;
  locHint: string | null;
  chatGateOpen: boolean;
  setChatGateOpen: (v: boolean) => void;
  setChatGateViewHref: (v: string | null) => void;
  setDisputeOpen: (v: boolean) => void;
  nextPro: { event: TripEvent; label: string } | undefined;
  arrivedBlocked: boolean;
  proAdvance: (event: TripEvent) => Promise<void>;
  cancelRequestInstant: (actor: JobViewer) => void;
}

/** Trip footer: status flashes, pro advance CTA, customer cancel, dispute. */
export function TripFooter({
  job,
  viewer,
  isLight,
  tradeLabel,
  showMap,
  busy,
  err,
  flash,
  locHint,
  chatGateOpen,
  setChatGateOpen,
  setChatGateViewHref,
  setDisputeOpen,
  nextPro,
  arrivedBlocked,
  proAdvance,
  cancelRequestInstant,
}: Props): ReactElement {
  return (
    <div className="relative space-y-2">
      <ChatEndedDialog
        open={chatGateOpen}
        isLight={isLight}
        setChatGateOpen={setChatGateOpen}
        setChatGateViewHref={setChatGateViewHref}
      />
      {flash && (
        <p className="text-center text-[12px] font-bold text-[#FF6B35]">
          {flash}
        </p>
      )}
      {locHint && showMap && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-center text-[12px] font-bold",
            isLight ? "bg-slate-900 text-white" : "bg-[#2c2c2e] text-white",
          )}
        >
          {locHint}
        </p>
      )}
      {err && (
        <p className="text-center text-[12px] font-semibold text-red-500">
          {err}
        </p>
      )}
      {viewer === "repair_pro" && nextPro && (
        <>
          {isLight ? (
            <CopperButton
              disabled={busy || arrivedBlocked}
              onClick={() => void proAdvance(nextPro.event)}
            >
              {busy ? "Updating job…" : nextPro.label}
            </CopperButton>
          ) : (
            <StageButton
              isLight={isLight}
              disabled={busy || arrivedBlocked}
              onClick={() => void proAdvance(nextPro.event)}
            >
              {busy ? "Updating job…" : nextPro.label}
            </StageButton>
          )}
        </>
      )}
      {viewer === "motorist" && job.status === "en_route" && (
        <p
          className={cn(
            "text-center text-[12px] font-semibold",
            isLight ? "text-slate-700" : "text-[#c8c9cd]",
          )}
        >
          {tradeLabel} is OnTheRoad
          {job.etaMinutes != null ? ` · ETA ${job.etaMinutes} min` : ""}
        </p>
      )}
      {viewer === "motorist" && job.status === "paid_booked" && (
        <button
          type="button"
          onClick={() => cancelRequestInstant("motorist")}
          className="inline-flex h-12 w-full items-center justify-center rounded-sm border-0 bg-[#3a3a3c] text-[14px] font-bold text-white transition active:scale-[0.99]"
        >
          Cancel full refund
        </button>
      )}
      {viewer === "motorist" &&
        (job.status === "en_route" ||
          job.status === "arrived" ||
          job.status === "in_progress") && (
          <button
            type="button"
            onClick={() => cancelRequestInstant("motorist")}
            className="inline-flex h-12 w-full items-center justify-center rounded-sm border-0 bg-[#3a3a3c] text-[14px] font-bold text-white transition active:scale-[0.99]"
          >
            Cancel full refund
          </button>
        )}
      <button
        type="button"
        onClick={() => setDisputeOpen(true)}
        className="w-full text-center text-[12px] font-bold text-red-500"
      >
        Open dispute
      </button>
    </div>
  );
}
