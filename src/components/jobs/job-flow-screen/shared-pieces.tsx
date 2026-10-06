import type { ReactElement } from "react";
import { CopperButton } from "@/components/jobs/job-shell";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { CONVERSATION_ENDED_MESSAGE } from "@/lib/chat-expired";
import { apiOpenDispute } from "@/lib/jobs/client";
import type { DisputeReason, JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { CancelConfirmSheet } from "../job-flow/cancel-confirm-sheet";
import { DisputeSheet } from "../job-flow/dispute-sheet";
import type { ConfirmCancelState, JobApiResult, JobViewer } from "./types";

/** Ended-chat gate: shown when Message is tapped on a closed conversation. */
export function ChatEndedDialog({
  open,
  isLight,
  setChatGateOpen,
  setChatGateViewHref,
}: {
  open: boolean;
  isLight: boolean;
  setChatGateOpen: (v: boolean) => void;
  setChatGateViewHref: (v: string | null) => void;
}): ReactElement {
  return (
    <ExpiredDialog
      open={open}
      isLight={isLight}
      message={CONVERSATION_ENDED_MESSAGE}
      onClose={() => {
        setChatGateOpen(false);
        setChatGateViewHref(null);
      }}
    />
  );
}

/** Confirm-before-cancel sheet driven by the `confirmCancel` state. */
export function CancelConfirmFromState({
  isLight,
  confirmCancel,
  setConfirmCancel,
  cancelRequestInstant,
}: {
  isLight: boolean;
  confirmCancel: ConfirmCancelState;
  setConfirmCancel: (v: ConfirmCancelState) => void;
  cancelRequestInstant: (actor: JobViewer) => void;
}): ReactElement {
  return (
    <CancelConfirmSheet
      open={!!confirmCancel}
      isLight={isLight}
      onClose={() => setConfirmCancel(null)}
      onConfirm={() => {
        const a = confirmCancel;
        if (!a) return;
        cancelRequestInstant(a.actor);
      }}
    />
  );
}

/** Reroute notification overlay for motorist. */
export function RerouteAlertOverlay({
  isLight,
  ink,
  muted,
  onContinue,
}: {
  isLight: boolean;
  ink: string;
  muted: string;
  onContinue: () => void;
}): ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-12">
      <div
        className={cn(
          "w-full max-w-[390px] rounded-t-2xl px-5 pb-6 pt-5",
          isLight ? "bg-[#c8c9cd]" : "bg-[#1c1c1e]",
        )}
      >
        <h2 className={cn("mb-2 text-[18px] font-bold", ink)}>
          Repair Pro Unavailable
        </h2>
        <p
          className={cn("mb-6 text-[14px] font-medium leading-relaxed", muted)}
        >
          The selected pro is currently unavailable and has declined your
          request. We&rsquo;re finding another pro with the same skill.
        </p>
        <CopperButton onClick={onContinue}>Continue Searching</CopperButton>
      </div>
    </div>
  );
}

interface DisputeNodeProps {
  open: boolean;
  by: JobViewer;
  job: JobRecord;
  isLight: boolean;
  reason: DisputeReason;
  setReason: (r: DisputeReason) => void;
  desc: string;
  setDesc: (d: string) => void;
  busy: boolean;
  setOpen: (v: boolean) => void;
  run: (fn: () => Promise<JobApiResult>) => Promise<void>;
}

/** Dispute sheet wired to `apiOpenDispute` (renders nothing while closed). */
export function DisputeNode({
  open,
  by,
  job,
  isLight,
  reason,
  setReason,
  desc,
  setDesc,
  busy,
  setOpen,
  run,
}: DisputeNodeProps): ReactElement | null {
  if (!open) return null;
  return (
    <DisputeSheet
      isLight={isLight}
      reason={reason}
      setReason={setReason}
      desc={desc}
      setDesc={setDesc}
      busy={busy}
      onClose={() => setOpen(false)}
      onSubmit={() =>
        void run(async () => {
          const res = await apiOpenDispute({
            jobId: job.id,
            by,
            reason,
            description: desc,
          });
          if (res.ok) setOpen(false);
          return res;
        })
      }
    />
  );
}
