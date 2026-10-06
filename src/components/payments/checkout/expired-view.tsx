"use client";

import { cn } from "@/lib/utils";
import type { CheckoutTone } from "./types";

export function ExpiredView({
  tone,
  attemptsLeft,
  err,
  jobId,
  onPayAgain,
  onBackToJob,
}: {
  tone: CheckoutTone;
  attemptsLeft: number;
  err: string | null;
  jobId: string;
  onPayAgain: () => void;
  onBackToJob: () => void;
}) {
  const { ink, muted } = tone;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-10">
      <p className={cn("text-center text-[16px] font-black", ink)}>
        {attemptsLeft <= 0 ? "No attempts left" : "Payment failed"}
      </p>
      <p className={cn("text-center text-[13px] font-medium", muted)}>
        {attemptsLeft <= 0
          ? "Booking cancelled."
          : `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left`}
      </p>
      {err ? (
        <p className="text-center text-[12px] font-semibold text-red-500">
          {err}
        </p>
      ) : null}
      {attemptsLeft > 0 ? (
        <button
          type="button"
          disabled={!jobId}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPayAgain();
          }}
          className="relative z-10 mt-2 inline-flex h-14 w-full max-w-sm cursor-pointer items-center justify-center rounded-2xl border-0 bg-[#FF6B35] text-[15px] font-black text-white active:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Pay again
        </button>
      ) : null}
      <button
        type="button"
        onClick={onBackToJob}
        className={cn("text-[13px] font-semibold", muted)}
      >
        Back to job
      </button>
    </div>
  );
}
