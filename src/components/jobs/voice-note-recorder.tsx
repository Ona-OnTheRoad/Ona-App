"use client";

import type { ReactNode } from "react";
import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { VOICE_MAX_SEC } from "@/lib/voice-record";
import { cn } from "@/lib/utils";
import type { JobMedia } from "@/lib/jobs/types";
import { RecorderControls } from "./voice-note-recorder/recorder-controls";
import type { Phase } from "./voice-note-recorder/types";
import { useVoiceRecorder } from "./voice-note-recorder/use-voice-recorder";

/**
 * Browser MediaRecorder voice note record, listen back, re-record.
 * Tuned to avoid UI lag: instant button feedback, low bitrate, less re-render.
 */
export function VoiceNoteRecorder({
  value,
  onChange,
  userId,
  isLight,
  onPhaseChange,
  leading,
}: {
  value: JobMedia | null;
  onChange: (v: JobMedia | null) => void;
  userId: string;
  isLight: boolean;
  onPhaseChange?: (phase: Phase) => void;
  /** Optional control rendered in front of the Record button. */
  leading?: ReactNode;
}) {
  const { phase, error, elapsed, elapsedEl, start, stop, reset } =
    useVoiceRecorder({ onChange, userId, onPhaseChange });

  const recording = phase === "recording";

  return (
    <div className="py-1">
      <div className="mb-2.5 flex items-center justify-between">
        <p
          className={cn(
            "text-[12px] font-bold",
            isLight ? "text-slate-700" : "text-white/70",
          )}
        >
          Voice note
        </p>
        {(phase !== "idle" || value) && (
          <span
            ref={elapsedEl}
            className="text-[12px] font-black tabular-nums text-[#FF6B35]"
          >
            {phase === "arming"
              ? "…"
              : phase === "saving"
                ? "Saving"
                : recording
                  ? `${elapsed}s`
                  : value?.durationSec
                    ? `${value.durationSec}s`
                    : ""}
          </span>
        )}
      </div>

      <RecorderControls
        phase={phase}
        value={value}
        leading={leading}
        isLight={isLight}
        start={start}
        stop={stop}
        reset={reset}
      />

      {value?.url && phase === "idle" && (
        <div className="mt-3">
          <VoiceNotePlayer
            url={value.url}
            durationSec={value.durationSec}
            isLight={isLight}
            label="Your voice note · tap play"
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-[12px] font-semibold text-red-500">{error}</p>
      )}
      <p
        className={cn(
          "mt-2 text-[11px]",
          isLight ? "text-slate-500" : "text-white/45",
        )}
      >
        Optional. Describe the problem out loud (max {VOICE_MAX_SEC}s). Play it
        back before you send.
      </p>
    </div>
  );
}
