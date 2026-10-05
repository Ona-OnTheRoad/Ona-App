import { cn } from "@/lib/utils";
import type { ExpressTheme } from "./types";

type Props = { theme: ExpressTheme; onBack: () => void };

/** One-open-request gate. */
export function BlockedView({ theme, onBack }: Props) {
  const { ink, muted } = theme;
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className={cn("text-[15px] font-extrabold", ink)}>
        You have an open request
      </p>
      <p className={cn("max-w-[270px] text-[13px] font-medium", muted)}>
        Complete, cancel, or let it expire before starting another one.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-2 h-11 w-full max-w-[280px] rounded-md border-0 bg-brand text-[14px] font-bold text-white"
      >
        Go back
      </button>
    </div>
  );
}
