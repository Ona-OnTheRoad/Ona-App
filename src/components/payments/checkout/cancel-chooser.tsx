"use client";

import { cn } from "@/lib/utils";
import type { CheckoutTone } from "./types";

export function CancelChooser({
  tone,
  busyCancel,
  onCancelPayment,
  onCancelRequest,
  onKeepPaying,
}: {
  tone: CheckoutTone;
  busyCancel: boolean;
  onCancelPayment: () => void;
  onCancelRequest: () => void;
  onKeepPaying: () => void;
}) {
  const { isLight, card, ink } = tone;
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-3">
      <div
        className={cn(
          "w-full max-w-md overflow-hidden rounded-2xl shadow-2xl",
          card,
        )}
        role="dialog"
        aria-label="Cancel options"
      >
        <div className="px-4 pb-2 pt-4">
          <p className={cn("text-center text-[15px] font-black", ink)}>
            Cancel
          </p>
        </div>
        <button
          type="button"
          disabled={busyCancel}
          onClick={onCancelPayment}
          className={cn(
            "flex h-12 w-full items-center justify-center border-0 text-[14px] font-bold",
            isLight
              ? "bg-transparent text-slate-900"
              : "bg-transparent text-white",
          )}
        >
          Cancel payment
        </button>
        <button
          type="button"
          disabled={busyCancel}
          onClick={onCancelRequest}
          className={cn(
            "flex h-12 w-full items-center justify-center border-0 text-[14px] font-bold text-red-500",
          )}
        >
          {busyCancel ? "Cancelling…" : "Cancel request"}
        </button>
        <button
          type="button"
          disabled={busyCancel}
          onClick={onKeepPaying}
          className={cn(
            "flex h-11 w-full items-center justify-center border-0 text-[13px] font-semibold",
            isLight ? "text-slate-500" : "text-white/50",
          )}
        >
          Keep paying
        </button>
      </div>
    </div>
  );
}
