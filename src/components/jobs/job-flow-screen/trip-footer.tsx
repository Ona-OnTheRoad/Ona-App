import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import type { JobRecord } from "@/lib/jobs/types";
import { ChatEndedDialog } from "./shared-pieces";
import type { JobViewer, TripEvent } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
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
  const cancellable =
    viewer === "motorist" &&
    (job.status === "paid_booked" ||
      job.status === "en_route" ||
      job.status === "arrived" ||
      job.status === "in_progress");
  return (
    <div className="relative space-y-2">
      <ChatEndedDialog
        open={chatGateOpen}
        isLight={isLight}
        setChatGateOpen={setChatGateOpen}
        setChatGateViewHref={setChatGateViewHref}
      />
      {flash && (
        <p
          role="status"
          className="text-center text-[12px] font-semibold text-ona-brand-ink"
        >
          {flash}
        </p>
      )}
      {locHint && showMap && (
        <p
          role="status"
          className="rounded-ona-ctl bg-ona-dark px-3 py-2 text-center text-[12px] font-semibold text-ona-on-dark"
        >
          {locHint}
        </p>
      )}
      {err && (
        <p
          role="alert"
          className="text-center text-[12px] font-semibold text-ona-danger"
        >
          {err}
        </p>
      )}
      {viewer === "repair_pro" && nextPro && (
        <Button
          variant="ona"
          size="ona"
          disabled={busy || arrivedBlocked}
          onClick={() => void proAdvance(nextPro.event)}
        >
          {busy ? "Updating job…" : nextPro.label}
        </Button>
      )}
      {cancellable && (
        <button
          type="button"
          onClick={() => cancelRequestInstant("motorist")}
          className="inline-flex h-12 w-full items-center justify-center rounded-ona-ctl border-0 bg-ona-danger/10 text-[14px] font-semibold text-ona-danger active:bg-ona-danger/20"
        >
          Cancel full refund
        </button>
      )}
      <button
        type="button"
        onClick={() => setDisputeOpen(true)}
        className="h-11 w-full text-center text-[12px] font-semibold text-ona-danger"
      >
        Open dispute
      </button>
    </div>
  );
}
