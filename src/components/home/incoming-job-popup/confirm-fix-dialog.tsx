import { Loader2 } from "lucide-react";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";

export function ConfirmFixDialog({
  confirmFix,
  isLight,
  acceptingId,
  onCancel,
  onConfirm,
}: {
  confirmFix: JobRecord;
  isLight: boolean;
  acceptingId: string | null;
  onCancel: () => void;
  onConfirm: (job: JobRecord) => void;
}) {
  return (
    <div
      className="absolute inset-0 z-[190] flex items-end justify-center bg-black/45 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal
      aria-label="Confirm you can fix this"
    >
      <div
        className={cn(
          "w-full max-w-[360px] rounded-2xl border-0 p-5",
          isLight ? "bg-[#c8c9cd] text-slate-900" : "bg-black text-white",
        )}
      >
        <p className="text-[15px] font-black">Confirm you can fix this</p>
        <p
          className={cn(
            "mt-1.5 text-[13px] font-medium leading-relaxed",
            isLight ? "text-slate-600" : "text-white/60",
          )}
        >
          You&apos;re confirming you can fix this job as a professional{" "}
          {PRO_SERVICE_LABELS[
            confirmFix.serviceType as keyof typeof PRO_SERVICE_LABELS
          ] || "Repair Pro"}
          , and you won&apos;t get call out fee if you don&apos;t.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border-0 bg-white/10 text-[13px] font-bold text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!!acceptingId}
            onClick={() => onConfirm(confirmFix)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border-0 bg-[#FF6B35] text-[13px] font-bold text-white"
          >
            {acceptingId === confirmFix.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            I can fix it
          </button>
        </div>
      </div>
    </div>
  );
}
