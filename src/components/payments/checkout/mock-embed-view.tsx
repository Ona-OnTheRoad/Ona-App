"use client";

import { cn } from "@/lib/utils";
import type { CheckoutTone } from "./types";

export function MockEmbedView({
  tone,
  payUrl,
  onClose,
}: {
  tone: CheckoutTone;
  payUrl: string;
  onClose: () => void;
}) {
  const { isLight, ink } = tone;
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2",
          isLight
            ? "border-black/10 bg-white/90"
            : "border-white/10 bg-black/40",
        )}
      >
        <p className={cn("text-[12px] font-black", ink)}>Mock checkout</p>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "rounded-lg border-0 px-2.5 py-1.5 text-[11px] font-bold",
            isLight ? "bg-black/8 text-slate-800" : "bg-white/10 text-white",
          )}
        >
          Close
        </button>
      </div>
      <iframe
        title="Mock secure checkout"
        src={payUrl}
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
