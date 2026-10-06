import { cn } from "@/lib/utils";

/** Soft grey square lock popup */
export function GatePopup({
  message,
  isLight,
  onClose,
}: {
  message: string;
  isLight: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-[120] flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/20"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[1] flex aspect-square w-[min(100%,260px)] max-h-[260px]",
          "flex-col items-center justify-center rounded-[0.65rem] px-5 py-6 text-center",
          "border-0 shadow-none",
          // Match phone shell grey exactly
          isLight ? "bg-[#c8c9cd] text-slate-900" : "bg-black text-[#f2f2f7]",
        )}
      >
        <p className="text-[14px] font-bold leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 h-10 w-full rounded-[0.5rem] border-0 bg-[#FF6B35] text-[13px] font-bold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
