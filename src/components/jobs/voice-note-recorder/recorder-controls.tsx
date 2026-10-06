import { Loader2, Mic, RotateCcw, Square } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { JobMedia } from "@/lib/jobs/types";
import type { Phase } from "./types";

export function RecorderControls({
  phase,
  value,
  leading,
  isLight,
  start,
  stop,
  reset,
}: {
  phase: Phase;
  value: JobMedia | null;
  leading?: ReactNode;
  isLight: boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}) {
  const recording = phase === "recording";
  const busy = phase === "arming" || phase === "saving";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {leading}
      {!value && phase === "idle" && (
        <button
          type="button"
          onClick={() => void start()}
          className="inline-flex h-11 items-center gap-2 rounded-md border-0 bg-[#FF6B35] px-4 text-[13px] font-bold text-white"
        >
          <Mic className="h-4 w-4" />
          Record
        </button>
      )}
      {phase === "arming" && (
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center gap-2 rounded-md border-0 bg-[#FF6B35]/80 px-4 text-[13px] font-bold text-white"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting…
        </button>
      )}
      {recording && (
        <button
          type="button"
          onClick={stop}
          className="inline-flex h-11 items-center gap-2 rounded-md border-0 bg-red-500 px-4 text-[13px] font-bold text-white"
        >
          <Square className="h-4 w-4 fill-current" />
          Stop
        </button>
      )}
      {phase === "saving" && (
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center gap-2 rounded-md border-0 bg-red-500/80 px-4 text-[13px] font-bold text-white"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving…
        </button>
      )}
      {value && !busy && !recording && (
        <button
          type="button"
          onClick={reset}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-md border-0 px-4 text-[13px] font-bold",
            isLight ? "bg-black/10 text-slate-800" : "bg-white/10 text-white",
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Re-record
        </button>
      )}
    </div>
  );
}
