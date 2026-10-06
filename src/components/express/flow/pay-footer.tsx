import { Loader2 } from "lucide-react";
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
  theme,
  cancelAsk,
  cancelBusy,
  setCancelAsk,
  onCancel,
}: Props) {
  const { ink, muted } = theme;
  return (
    <div className={PINNED_BOTTOM}>
      <div className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand text-[15px] font-bold text-white">
        <Loader2 className="h-4 w-4 animate-spin" />
        Waiting for payment…
      </div>
      {!cancelAsk ? (
        <button
          type="button"
          onClick={() => setCancelAsk(true)}
          className={cn(
            "mt-1 h-9 w-full border-0 bg-transparent text-[12px] font-semibold underline-offset-2 hover:underline",
            muted,
          )}
        >
          Cancel this request
        </button>
      ) : (
        <div className="mt-1 flex flex-col gap-1">
          <button
            type="button"
            disabled={cancelBusy}
            onClick={() => onCancel("both")}
            className="h-9 w-full rounded-md border-0 bg-black/8 text-[12px] font-bold text-red-500 dark:bg-white/10 disabled:opacity-50"
          >
            Cancel payment and request
          </button>
          <button
            type="button"
            disabled={cancelBusy}
            onClick={() => onCancel("payment")}
            className={cn(
              "h-9 w-full rounded-md border-0 bg-black/8 text-[12px] font-bold",
              ink,
              "disabled:opacity-50",
            )}
          >
            Cancel payment only
          </button>
          <button
            type="button"
            disabled={cancelBusy}
            onClick={() => setCancelAsk(false)}
            className={cn(
              "h-8 w-full border-0 bg-transparent text-[12px] font-semibold",
              muted,
            )}
          >
            Keep paying
          </button>
        </div>
      )}
    </div>
  );
}
