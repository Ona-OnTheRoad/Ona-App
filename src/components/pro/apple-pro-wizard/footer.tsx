import { cn } from "@/lib/utils";
import { proSheetBg } from "./tokens";

/** Fixed bottom bar: Back + Continue on same sheet color */
export function AppleProFooter({
  isLight,
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Continue",
  nextDisabled,
  nextBusy,
  hideBack,
}: {
  isLight: boolean;
  onBack?: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
  hideBack?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 flex-col gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      style={{ backgroundColor: proSheetBg(isLight) }}
    >
      <button
        type="button"
        disabled={nextDisabled || nextBusy}
        onClick={onNext}
        className="flex h-12 w-full items-center justify-center rounded-xl border-0 bg-[#323231] text-[16px] font-semibold text-white disabled:opacity-40"
      >
        {nextBusy ? "Please wait…" : nextLabel}
      </button>
      {!hideBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "h-10 w-full border-0 bg-transparent text-[15px] font-semibold",
            isLight ? "text-slate-600" : "text-white/60",
          )}
        >
          {backLabel}
        </button>
      ) : null}
    </div>
  );
}
