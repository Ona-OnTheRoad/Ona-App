import { useCallback } from "react";
import { postCallSignal } from "@/lib/call-signal";
import { getLowBandwidthAudioStream } from "@/lib/webrtc-audio";
import { isUuid } from "./helpers";
import type { CallRefs, SignalKind } from "./types";

/** Timers, mic stream, remote audio element, peer teardown and signal posting. */
export function useCallMedia(refs: CallRefs) {
  const {
    timerRef,
    ringFailTimerRef,
    iceFailTimerRef,
    ringTimerRef,
    bitrateStopRef,
    streamRef,
    remoteAudioRef,
    pcRef,
    pendingIceRef,
    myIdRef,
  } = refs;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (ringFailTimerRef.current) {
      window.clearTimeout(ringFailTimerRef.current);
      ringFailTimerRef.current = null;
    }
    if (iceFailTimerRef.current) {
      window.clearTimeout(iceFailTimerRef.current);
      iceFailTimerRef.current = null;
    }
    if (ringTimerRef.current) {
      window.clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    if (bitrateStopRef.current) {
      bitrateStopRef.current();
      bitrateStopRef.current = null;
    }
  }, [
    timerRef,
    ringFailTimerRef,
    iceFailTimerRef,
    ringTimerRef,
    bitrateStopRef,
  ]);

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, [streamRef, remoteAudioRef]);

  const closePeer = useCallback(() => {
    if (bitrateStopRef.current) {
      bitrateStopRef.current();
      bitrateStopRef.current = null;
    }
    try {
      pcRef.current?.close();
    } catch {
      /* */
    }
    pcRef.current = null;
    pendingIceRef.current = [];
  }, [bitrateStopRef, pcRef, pendingIceRef]);

  const pushSignal = useCallback(
    async (
      toUserId: string,
      kind: SignalKind,
      callId: string,
      payload: Record<string, unknown>,
    ) => {
      const me = myIdRef.current;
      if (!me || !isUuid(toUserId) || !isUuid(me)) return "invalid ids";
      return postCallSignal({
        callId,
        toUserId,
        fromUserId: me,
        kind,
        payload,
      });
    },
    [myIdRef],
  );

  const attachRemote = useCallback(
    (stream: MediaStream) => {
      const existing = remoteAudioRef.current;
      if (existing) {
        existing.srcObject = stream;
        existing.volume = 1;
        existing.muted = false;
        void existing.play().catch(() => {
          window.setTimeout(() => {
            void remoteAudioRef.current?.play().catch(() => undefined);
          }, 200);
        });
        return;
      }
      const el = document.createElement("audio");
      el.autoplay = true;
      el.setAttribute("playsinline", "true");
      (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      el.style.display = "none";
      el.srcObject = stream;
      el.volume = 1;
      el.muted = false;
      document.body.appendChild(el);
      remoteAudioRef.current = el;
      void el.play().catch(() => {
        window.setTimeout(() => {
          void remoteAudioRef.current?.play().catch(() => undefined);
        }, 200);
      });
    },
    [remoteAudioRef],
  );

  const ensureMic = useCallback(async () => {
    if (streamRef.current) return streamRef.current;
    const stream = await getLowBandwidthAudioStream();
    if (stream) streamRef.current = stream;
    return stream;
  }, [streamRef]);

  const flushIce = useCallback(
    async (pc: RTCPeerConnection) => {
      const list = pendingIceRef.current.splice(0);
      for (const c of list) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          /* */
        }
      }
    },
    [pendingIceRef],
  );

  return {
    clearTimers,
    stopMedia,
    closePeer,
    pushSignal,
    attachRemote,
    ensureMic,
    flushIce,
  };
}

export type CallMedia = ReturnType<typeof useCallMedia>;
