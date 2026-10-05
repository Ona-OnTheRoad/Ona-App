import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function SnoozedDialog({
  isLight,
  onDismiss,
}: {
  isLight: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-[180] flex items-end justify-center bg-black/35 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal
      aria-label="Request snoozed"
    >
      <div
        className={cn(
          "w-full max-w-[360px] rounded-2xl border-0 p-5 text-center",
          isLight ? "bg-[#c8c9cd] text-slate-900" : "bg-black text-white",
        )}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B35]/20">
          <Clock className="h-6 w-6 text-[#FF6B35]" />
        </div>
        <p className="text-[16px] font-black">Request snoozed</p>
        <p
          className={cn(
            "mt-1.5 text-[12px] font-medium leading-relaxed",
            isLight ? "text-slate-600" : "text-white/60",
          )}
        >
          Kept in your incoming list and still acceptable until the timer runs
          out.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 h-11 w-full rounded-xl border-0 bg-[#FF6B35] text-[13px] font-bold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
