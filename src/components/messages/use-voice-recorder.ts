"use client";

import { useEffect, useRef, useState } from "react";
import {
  blobToDataUrl,
  createMediaRecorder,
  getMicStream,
  waitRecorderStart,
} from "@/lib/voice-record";

export type RecPhase = "idle" | "arming" | "recording" | "saving";

export type PendingVoice = {
  url: string;
  durationSec: number;
  mime: string;
};

/** Voice-note recording state machine for the chat composer. */
export function useVoiceRecorder(chatClosed: boolean) {
  /** idle | arming | recording | saving */
  const [recPhase, setRecPhase] = useState<RecPhase>("idle");
  const [pendingVoice, setPendingVoice] = useState<PendingVoice | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const stopLock = useRef(false);

  useEffect(() => {
    return () => {
      try {
        mediaRef.current?.stop();
      } catch {
        /* */
      }
    };
  }, []);

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* */
      }
    });
    streamRef.current = null;
  };

  const startRec = async () => {
    if (chatClosed || recPhase !== "idle" || stopLock.current) return;
    setRecError(null);
    setRecPhase("arming");
    if (typeof MediaRecorder === "undefined") {
      setRecError("Voice not supported on this device");
      setRecPhase("idle");
      return;
    }
    try {
      const stream = await getMicStream();
      streamRef.current = stream;
      const rec = createMediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunks.current.push(e.data);
      };
      rec.onerror = () => {
        setRecError("Recording failed");
        releaseMic();
        mediaRef.current = null;
        setRecPhase("idle");
      };
      mediaRef.current = rec;
      // 1s timeslice less main-thread work than 200ms chunks
      rec.start(1000);
      await waitRecorderStart(rec);
      startedAt.current = Date.now();
      setRecPhase("recording");
    } catch {
      releaseMic();
      mediaRef.current = null;
      setRecError("Allow microphone to send a voice note");
      setRecPhase("idle");
    }
  };

  const stopRec = () => {
    if (stopLock.current) return;
    const rec = mediaRef.current;
    if (!rec || rec.state === "inactive") {
      setRecPhase("idle");
      return;
    }
    stopLock.current = true;
    // Leave recording UI immediately so Stop does not feel stuck while encoding
    setRecPhase("saving");
    const blobType = rec.mimeType || "audio/webm";
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - startedAt.current) / 1000),
    );

    rec.onstop = () => {
      releaseMic();
      mediaRef.current = null;
      void (async () => {
        try {
          const blob = new Blob(chunks.current, { type: blobType });
          if (!blob.size) {
            setRecError("No audio captured");
            setRecPhase("idle");
            return;
          }
          // Yield so "Saving" paints before FileReader work
          await new Promise((r) => window.setTimeout(r, 0));
          const url = await blobToDataUrl(blob);
          setPendingVoice({ url, durationSec, mime: blobType });
          setRecPhase("idle");
        } catch {
          setRecError("Could not save voice note");
          setRecPhase("idle");
        } finally {
          stopLock.current = false;
        }
      })();
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
        // Already stopped finish via the same onstop path
        const handler = rec.onstop;
        if (typeof handler === "function") {
          handler.call(rec, new Event("stop"));
        } else {
          releaseMic();
          mediaRef.current = null;
          setRecPhase("idle");
          stopLock.current = false;
        }
      }
    } catch {
      releaseMic();
      mediaRef.current = null;
      setRecPhase("idle");
      stopLock.current = false;
    }
  };

  return {
    recPhase,
    pendingVoice,
    setPendingVoice,
    recError,
    startRec,
    stopRec,
  };
}
