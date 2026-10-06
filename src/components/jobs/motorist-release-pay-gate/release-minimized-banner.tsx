import { CheckCircle2 } from "lucide-react";

export function ReleaseMinimizedBanner({ onExpand }: { onExpand: () => void }) {
  return (
    <div
      className="absolute bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-3 right-3 z-[97]"
      role="status"
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full items-center gap-3 rounded-2xl border-0 px-4 py-3 text-left shadow-lg active:opacity-95"
        style={{ backgroundColor: "#FF6B35" }}
        aria-label="Release payment"
      >
        <CheckCircle2 className="h-8 w-8 shrink-0 text-white" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black uppercase tracking-wide text-white">
            Release payment
          </p>
          <p className="mt-0.5 truncate text-[12px] font-semibold text-white/95">
            Tap to confirm
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-bold text-white/90">
          Open
        </span>
      </button>
    </div>
  );
}
