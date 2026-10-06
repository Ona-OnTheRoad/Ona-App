import { useEffect, useRef, useState } from "react";
import {
  VOICE_MAX_SEC,
  blobToDataUrl,
  createMediaRecorder,
  extForMime,
  getMicStream,
  waitRecorderStart,
} from "@/lib/voice-record";
import type { JobMedia } from "@/lib/jobs/types";
import type { Phase } from "./types";

function wallClockMs(): number {
  return Date.now();
}

/** MediaRecorder state machine for VoiceNoteRecorder (logic only, no UI). */
export function useVoiceRecorder({
  onChange,
  userId,
  onPhaseChange,
}: {
  onChange: (v: JobMedia | null) => void;
  userId: string;
  onPhaseChange?: (phase: Phase) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<number | null>(null);
  const elapsedEl = useRef<HTMLSpanElement | null>(null);
  const stopLock = useRef(false);

  const clearTimer = () => {
    if (timer.current != null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* */
      }
    });
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimer();
      try {
        mediaRef.current?.stop();
      } catch {
        /* */
      }
      releaseStream();
    };
  }, []);

  const paintElapsed = (sec: number) => {
    setElapsed(sec);
    if (elapsedEl.current) {
      elapsedEl.current.textContent = `${sec}s`;
    }
  };

  const start = async () => {
    if (phase !== "idle" || stopLock.current) return;
    setError(null);
    setPhase("arming");
    paintElapsed(0);

    if (typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported on this device.");
      setPhase("idle");
      return;
    }

    try {
      const stream = await getMicStream();
      streamRef.current = stream;
      const rec = createMediaRecorder(stream);
      chunks.current = [];
      stopLock.current = false;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.current.push(e.data);
      };

      rec.onerror = () => {
        setError("Recording failed. Try again.");
        clearTimer();
        releaseStream();
        mediaRef.current = null;
        setPhase("idle");
      };

      rec.onstop = () => {
        // Handled in stop() after requestData keep handler light
      };

      mediaRef.current = rec;
      // 1s timeslice: fewer callbacks than 200ms (was a source of main-thread lag)
      rec.start(1000);
      await waitRecorderStart(rec);
      startedAt.current = wallClockMs();
      setPhase("recording");
      paintElapsed(0);

      clearTimer();
      // 250ms is enough for a smooth counter without thrashing React
      timer.current = window.setInterval(() => {
        const sec = Math.floor((wallClockMs() - startedAt.current) / 1000);
        paintElapsed(sec);
        if (sec >= VOICE_MAX_SEC) {
          void finishRecording();
        }
      }, 250);
    } catch {
      releaseStream();
      mediaRef.current = null;
      setError("Allow microphone access to record a voice note.");
      setPhase("idle");
    }
  };

  const finishRecording = async () => {
    if (stopLock.current) return;
    const rec = mediaRef.current;
    if (!rec || rec.state === "inactive") {
      setPhase("idle");
      return;
    }
    stopLock.current = true;
    clearTimer();
    // Leave "recording" UI immediately so Stop doesn't feel stuck
    setPhase("saving");

    const blobType = rec.mimeType || "audio/webm";
    const durationSec = Math.max(
      1,
      Math.min(
        VOICE_MAX_SEC,
        Math.round((wallClockMs() - startedAt.current) / 1000),
      ),
    );

    const blob = await new Promise<Blob>((resolve) => {
      const finalize = () => {
        resolve(new Blob(chunks.current, { type: blobType }));
      };
      rec.onstop = () => {
        releaseStream();
        mediaRef.current = null;
        finalize();
      };
      try {
        if (rec.state === "recording") {
          try {
            rec.requestData();
          } catch {
            /* */
          }
          rec.stop();
        } else {
          releaseStream();
          mediaRef.current = null;
          finalize();
        }
      } catch {
        releaseStream();
        mediaRef.current = null;
        finalize();
      }
    });

    if (!blob.size) {
      setError("No audio captured. Hold closer and try again.");
      setPhase("idle");
      stopLock.current = false;
      return;
    }

    try {
      // Yield so the "Saving…" paint lands before heavy FileReader work
      await new Promise((r) => window.setTimeout(r, 0));
      const dataUrl = await blobToDataUrl(blob);
      const ext = extForMime(blobType);
      onChange({
        id: `voice_${Date.now()}`,
        kind: "voice",
        url: dataUrl,
        name: `voice-${durationSec}s.${ext}`,
        mime: blobType,
        durationSec,
        createdAt: new Date().toISOString(),
        uploadedBy: userId,
      });
      setPhase("idle");
    } catch {
      setError("Could not save voice note. Try again.");
      setPhase("idle");
    } finally {
      stopLock.current = false;
    }
  };

  const stop = () => {
    void finishRecording();
  };

  const reset = () => {
    onChange(null);
    paintElapsed(0);
    setError(null);
  };

  return { phase, error, elapsed, elapsedEl, start, stop, reset };
}
