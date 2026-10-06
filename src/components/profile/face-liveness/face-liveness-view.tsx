import type { RefObject } from "react";
import { Check, Loader2, RefreshCw, ScanFace, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SESSION_LEN } from "./constants";
import type { LivenessPhase } from "./types";

type Props = {
  isLight: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  phase: LivenessPhase;
  step: number;
  feedback: string;
  progress: number;
  ready: boolean;
  modelReady: boolean;
  err: string | null;
  lockMinutes: string;
  onRetry: () => void;
  onClose: () => void;
};

export function FaceLivenessView({
  isLight,
  videoRef,
  phase,
  step,
  feedback,
  progress,
  ready,
  modelReady,
  err,
  lockMinutes,
  onRetry,
  onClose,
}: Props) {
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/60";
  const panel = isLight ? "bg-[#d4d5d9]" : "bg-[#1c1c1e]";

  return (
    <div className={cn("flex flex-col gap-3 rounded-md p-3", panel)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScanFace className="h-5 w-5 text-[#FF6B35]" />
          <div>
            <p className={cn("text-[14px] font-bold", ink)}>Face liveness</p>
            <p className={cn("text-[11px] font-medium", muted)}>
              {phase === "success"
                ? "Verified"
                : phase === "locked"
                  ? "Temporarily locked"
                  : `Step ${Math.min(step + 1, SESSION_LEN)} of ${SESSION_LEN}`}
            </p>
          </div>
        </div>
        {phase === "run" || phase === "boot" ? (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md border-0",
              isLight ? "bg-black/10" : "bg-white/10",
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Progress */}
      <div
        className={cn(
          "h-1 w-full overflow-hidden rounded-full",
          isLight ? "bg-black/10" : "bg-white/15",
        )}
      >
        <div
          className="h-full rounded-full bg-[#FF6B35] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Camera */}
      <div
        className={cn(
          "relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-md bg-black",
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
        {/* Oval guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "h-[68%] w-[72%] rounded-full border-2",
              phase === "success"
                ? "border-emerald-400"
                : "border-[#FF6B35]/80",
            )}
          />
        </div>
        {(!ready || !modelReady) && phase === "boot" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
            <p className="text-[11px] font-semibold text-white/90">
              {feedback}
            </p>
          </div>
        )}
        {phase === "success" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B35]">
              <Check className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] font-bold text-white">You look real</p>
          </div>
        )}
      </div>

      {/* Instruction */}
      <p
        className={cn(
          "min-h-[2.5rem] text-center text-[13px] font-semibold leading-snug",
          err ? "text-red-500" : ink,
        )}
      >
        {err || feedback}
      </p>

      {phase === "run" && (
        <p className={cn("text-center text-[10px] font-medium", muted)}>
          Follow the prompts · no video is saved
        </p>
      )}

      {phase === "locked" && (
        <p className={cn("text-center text-[11px] font-medium", muted)}>
          Come back in {lockMinutes}. Attempts reset after the wait.
        </p>
      )}

      <div className="flex gap-2">
        {phase !== "success" && phase !== "locked" && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "h-11 flex-1 rounded-md border-0 text-[12px] font-bold",
              isLight
                ? "bg-black/10 text-slate-800"
                : "bg-[#2c2c2e] text-white",
            )}
          >
            Cancel
          </button>
        )}
        {phase === "fail" && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border-0 bg-[#FF6B35] text-[12px] font-bold text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
        {phase === "locked" && (
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-md border-0 bg-[#323231] text-[12px] font-bold text-white"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
