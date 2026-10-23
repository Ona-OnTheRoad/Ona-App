import { cn } from "@/lib/utils";
import { PINNED_BOTTOM } from "./helpers";
import type { ExpressTheme } from "./types";

type Props = {
  theme: ExpressTheme;
  cancelAsk: boolean;
  cancelBusy: boolean;
  setCancelAsk: (v: boolean) => void;
  onCancel: (mode: "payment" | "both") => void;
};

export function PayFooter({
  cancelAsk,
  cancelBusy,
  setCancelAsk,
  onCancel,
}: Props) {
  return (
    <>
      <div className={cn(PINNED_BOTTOM, "flex flex-col items-center gap-2.5")}>
        <div className="flex h-12 w-full items-center justify-center rounded-[14px] bg-[#FF6B35] text-[15px] font-semibold text-white shadow-xs">
          Waiting for payment ...
        </div>
        <button
          type="button"
          onClick={() => setCancelAsk(true)}
          className="py-1 text-[13px] font-semibold text-gray-800 dark:text-zinc-200 hover:underline cursor-pointer border-0 bg-transparent"
        >
          Cancel this request
        </button>
      </div>

      {/* Cancel Bottom Sheet matching Figma Screen 3 */}
      {cancelAsk ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Dismiss cancel options"
            onClick={() => setCancelAsk(false)}
            className="fixed inset-0 border-0 bg-black/40 backdrop-blur-[1px] transition-opacity cursor-pointer"
          />

          {/* Bottom Sheet */}
          <div className="relative z-10 w-full max-w-md mx-auto rounded-t-[24px] bg-white px-5 pb-8 pt-3 shadow-2xl dark:bg-zinc-900 animate-[om-sheet-up_0.22s_ease-out]">
            {/* Grab handle */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-zinc-700" />

            <h3 className="mb-4 text-[16px] font-bold text-gray-900 dark:text-white">
              Cancel this request
            </h3>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setCancelAsk(false)}
                className="flex h-12 w-full items-center justify-center rounded-[14px] bg-[#FF6B35] text-[14px] font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer border-0"
              >
                Keep paying
              </button>

              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => onCancel("payment")}
                className="flex h-12 w-full items-center justify-center rounded-[14px] bg-gray-100 text-[14px] font-semibold text-gray-900 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 cursor-pointer border-0 disabled:opacity-50"
              >
                Cancel payment only
              </button>

              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => onCancel("both")}
                className="flex h-10 w-full items-center justify-center text-[14px] font-semibold text-[#FF6B35] transition-colors hover:underline cursor-pointer border-0 bg-transparent disabled:opacity-50"
              >
                Cancel payment and request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
