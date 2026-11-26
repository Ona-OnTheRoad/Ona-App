"use client";

import { cancelledByLabel } from "@/lib/jobs/pay-reopen";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import type { CheckoutTone } from "./types";

/** Shown instead of any payment screen once the job has been cancelled. */
export function CancelledView({
  tone,
  job,
  onHome,
}: {
  tone: CheckoutTone;
  job: JobRecord | null;
  onHome: () => void;
}) {
  const { ink, muted } = tone;
  const by = job ? cancelledByLabel(job) : "other";
  const who =
    by === "pro"
      ? "The Service Pro cancelled this request."
      : by === "customer"
        ? "This request was cancelled."
        : "This request was cancelled.";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-10" role="alert">
      <p className={cn("text-center text-[16px] font-black", ink)}>Request cancelled</p>
      <p className={cn("text-center text-[13px] font-medium", muted)}>
        {who} You have not been charged. If you already sent a transfer, it will be refunded.
      </p>
      <button
        type="button"
        onClick={onHome}
        className="mt-2 inline-flex h-14 w-full max-w-sm items-center justify-center rounded-2xl border-0 bg-[#FF6B35] text-[15px] font-black text-white active:opacity-90"
      >
        Find another pro
      </button>
    </div>
  );
}
