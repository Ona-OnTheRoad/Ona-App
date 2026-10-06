import { useCallback } from "react";
import { playPersonTone } from "@/lib/sound-tone";
import {
  applyAudioSenderBitrate,
  DEFAULT_BITRATE_BPS,
  startAdaptiveBitrateLoop,
} from "@/lib/webrtc-audio";
import { openTelDialer } from "./helpers";
import type { CallMedia } from "./use-call-media";
import type { CallRefs, CallSetters } from "./types";

/** Phone fallback, end-call teardown, ICE watchdog and connected transition. */
export function useCallLifecycle(
  refs: CallRefs,
  set: CallSetters,
  media: CallMedia,
) {
  const {
    answeredRef,
    phaseRef,
    phoneRef,
    timerRef,
    callIdRef,
    peerIdRef,
    myIdRef,
    connectedOnceRef,
    iceFailTimerRef,
    ringFailTimerRef,
    ringTimerRef,
    bitrateStopRef,
    pcRef,
  } = refs;
  const {
    setStatusHint,
    setMode,
    setPhase,
    setSeconds,
    setIncoming,
    setTarget,
    setMuted,
    setSpeaker,
  } = set;
  const { clearTimers, stopMedia, closePeer, pushSignal } = media;

  const fallToPhone = useCallback(
    (reason: string) => {
      // Never yank WebRTC mid-handshake after answer/accept
      if (answeredRef.current && phaseRef.current === "connecting") {
        setStatusHint(
          reason ||
            "Still linking voice… stay on this screen (both apps open, mic allowed)",
        );
        return false;
      }
      const phone = phoneRef.current.replace(/[^\d+]/g, "");
      if (!phone) {
        setStatusHint(reason || "Call failed");
        return false;
      }
      setMode("phone");
      setPhase("dialing");
      setStatusHint("Opening phone line…");
      clearTimers();
      stopMedia();
      closePeer();
      window.setTimeout(() => {
        openTelDialer(phone);
        setPhase("connected");
        setStatusHint("Phone dialer open");
        timerRef.current = window.setInterval(
          () => setSeconds((s) => s + 1),
          1000,
        );
      }, 300);
      return true;
    },
    [
      answeredRef,
      phaseRef,
      phoneRef,
      timerRef,
      setStatusHint,
      setMode,
      setPhase,
      setSeconds,
      clearTimers,
      closePeer,
      stopMedia,
    ],
  );

  const endCall = useCallback(async () => {
    const peer = peerIdRef.current;
    const callId = callIdRef.current;
    if (peer && callId) {
      void pushSignal(peer, "hangup", callId, {});
    }
    playPersonTone(peer || myIdRef.current || "self", "call_end");
    clearTimers();
    stopMedia();
    closePeer();
    callIdRef.current = null;
    peerIdRef.current = null;
    phoneRef.current = "";
    answeredRef.current = false;
    connectedOnceRef.current = false;
    setIncoming(null);
    setPhase((p) => (p === "idle" ? "idle" : "ended"));
    setStatusHint("");
    window.setTimeout(() => {
      setTarget(null);
      setPhase("idle");
      setMode(null);
      setSeconds(0);
      setMuted(false);
      setSpeaker(true);
    }, 500);
  }, [
    peerIdRef,
    callIdRef,
    myIdRef,
    phoneRef,
    answeredRef,
    connectedOnceRef,
    setIncoming,
    setPhase,
    setStatusHint,
    setTarget,
    setMode,
    setSeconds,
    setMuted,
    setSpeaker,
    clearTimers,
    closePeer,
    pushSignal,
    stopMedia,
  ]);

  const scheduleIceFailWatch = useCallback(() => {
    if (iceFailTimerRef.current) {
      window.clearTimeout(iceFailTimerRef.current);
    }
    iceFailTimerRef.current = window.setTimeout(() => {
      if (phaseRef.current === "connected" || connectedOnceRef.current) return;
      if (phaseRef.current !== "connecting") return;
      // One ICE restart attempt
      const pc = pcRef.current;
      if (pc && pc.connectionState !== "closed") {
        try {
          pc.restartIce();
          setStatusHint("Retrying connection… keep both apps open");
        } catch {
          /* */
        }
      }
      // After restart, another 12s then soft fail (phone only if not answered path with no phone)
      iceFailTimerRef.current = window.setTimeout(() => {
        if (phaseRef.current === "connected" || connectedOnceRef.current)
          return;
        if (!fallToPhone("Could not link in-app voice")) {
          setStatusHint(
            "Still connecting… stay here with mic on. Or use Call on phone line.",
          );
        }
      }, 12_000);
    }, 10_000);
  }, [iceFailTimerRef, phaseRef, connectedOnceRef, pcRef, setStatusHint, fallToPhone]);

  const markConnected = useCallback(() => {
    if (connectedOnceRef.current && phaseRef.current === "connected") return;
    connectedOnceRef.current = true;
    answeredRef.current = true;
    setPhase("connected");
    setStatusHint("In-app voice connected");
    if (!timerRef.current) {
      timerRef.current = window.setInterval(
        () => setSeconds((s) => s + 1),
        1000,
      );
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
    const pc = pcRef.current;
    if (pc && !bitrateStopRef.current) {
      void applyAudioSenderBitrate(pc, DEFAULT_BITRATE_BPS);
      bitrateStopRef.current = startAdaptiveBitrateLoop(pc, 3000);
    }
  }, [
    connectedOnceRef,
    phaseRef,
    answeredRef,
    timerRef,
    ringFailTimerRef,
    iceFailTimerRef,
    ringTimerRef,
    bitrateStopRef,
    pcRef,
    setPhase,
    setStatusHint,
    setSeconds,
  ]);

  return { fallToPhone, endCall, scheduleIceFailWatch, markConnected };
}

export type CallLifecycle = ReturnType<typeof useCallLifecycle>;
