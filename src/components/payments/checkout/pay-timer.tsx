"use client";

import { useExactCountdown } from "@/lib/jobs/use-exact-countdown";
import { cn } from "@/lib/utils";

/** Very simple pay-window countdown: "Time left · MM:SS" (fires exactly at 0). */
export function PayTimer({
  deadline,
  onExpire,
}: {
  deadline: string;
  onExpire?: () => void;
}) {
  const { displayMs: leftMs } = useExactCountdown(deadline, onExpire);

  const secs = Math.ceil(leftMs / 1000);
  const label = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(
    secs % 60,
  ).padStart(2, "0")}`;
  const urgent = leftMs <= 15_000;

  return (
    <p
      className={cn(
        "text-[13px] font-bold tabular-nums",
        urgent ? "text-red-500" : "text-[#FF6B35]",
      )}
    >
      Time left · {label}
    </p>
  );
}
