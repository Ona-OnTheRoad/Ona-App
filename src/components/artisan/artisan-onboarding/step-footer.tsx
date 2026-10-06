import { cn } from "@/lib/utils";

/** Apple footer primary Continue, text Back */
export function StepFooter({
  sheetBg,
  navBack,
  canContinue,
  canGoBack,
  onContinue,
  onBack,
}: {
  sheetBg: string;
  navBack: string;
  canContinue: boolean;
  canGoBack: boolean;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="flex shrink-0 flex-col gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      style={{ backgroundColor: sheetBg }}
    >
      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl border-0 bg-[#323231] text-[16px] font-semibold text-white disabled:opacity-40"
      >
        Continue
      </button>
      <button
        type="button"
        disabled={!canGoBack}
        onClick={onBack}
        className={cn(
          "h-10 w-full border-0 bg-transparent text-[15px] font-semibold disabled:opacity-40",
          navBack,
        )}
      >
        Back
      </button>
    </div>
  );
}
