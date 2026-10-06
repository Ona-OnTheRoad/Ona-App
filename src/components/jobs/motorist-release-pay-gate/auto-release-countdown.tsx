import { useEffect, useState } from "react";
import { COMPLETED_AUTO_RELEASE_WINDOW_MS } from "@/lib/jobs/constants";

export function AutoReleaseCountdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(() =>
    Math.max(0, new Date(endsAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const tick = () => {
      setLeft(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const totalSec = Math.floor(left / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const pct = Math.min(
    100,
    Math.max(0, (left / COMPLETED_AUTO_RELEASE_WINDOW_MS) * 100),
  );

  return (
    <div className="mt-3 w-full">
      <p className="text-center text-[11px] font-semibold text-black">
        Auto-release in
      </p>
      <p
        className="mt-0.5 text-center text-[22px] font-black tabular-nums tracking-tight"
        style={{ color: totalSec <= 3600 ? "#ef4444" : undefined }}
        role="timer"
        aria-live="polite"
      >
        {label}
      </p>
      <div className="mx-auto mt-2 h-[3px] w-full max-w-[200px] overflow-hidden rounded-full bg-black/15">
        <div
          className="h-full rounded-full bg-[#FF6B35] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-center text-[10px] font-medium opacity-70">
        Confirm job completion
      </p>
    </div>
  );
}
