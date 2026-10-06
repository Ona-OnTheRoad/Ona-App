import { useCallback } from "react";
import {
  canNotify,
  ensureNotifyPermission,
  showAppNotification,
  vibrateCallPattern,
} from "@/lib/app-notify";
import type { CallSignalRow } from "@/lib/call-signal";
import { playPersonTone, unlockAudio } from "@/lib/sound-tone";
import { asRemoteDesc } from "./helpers";
import type { CallLifecycle } from "./use-call-lifecycle";
import type { CallMedia } from "./use-call-media";
import type { CallRefs, CallSetters } from "./types";

/** Handles one incoming signaling row (offer/answer/ice/accepting/hangup/reject). */
export function useProcessSignal(
  refs: CallRefs,
  set: CallSetters,
  media: CallMedia,
  lifecycle: CallLifecycle,
) {
  const {
    processedIdsRef,
    myIdRef,
    callIdRef,
    peerIdRef,
    answeredRef,
    connectedOnceRef,
    ringFailTimerRef,
    ringTimerRef,
    phaseRef,
    pcRef,
    pendingIceRef,
  } = refs;
  const {
    setIncoming,
    setPhase,
    setStatusHint,
    setTarget,
    setMode,
    setSeconds,
  } = set;
  const { clearTimers, stopMedia, closePeer, flushIce } = media;
  const { fallToPhone, scheduleIceFailWatch } = lifecycle;

  const notifyIncomingCall = useCallback((fromName: string, callId: string) => {
    vibrateCallPattern();
    void ensureNotifyPermission().then((p) => {
      if (p === "granted" || canNotify()) {
        showAppNotification({
          title: "Incoming call",
          body: `${fromName} is calling on Ona`,
          tag: `call-${callId}`,
          requireInteraction: true,
        });
      }
    });
    // Also try without waiting if already granted
    if (canNotify()) {
      showAppNotification({
        title: "Incoming call",
        body: `${fromName} is calling on Ona`,
        tag: `call-${callId}`,
        requireInteraction: true,
      });
    }
  }, []);

  const processSignal = useCallback(
    async (row: CallSignalRow) => {
      if (processedIdsRef.current.has(row.id)) return;
      processedIdsRef.current.add(row.id);
      if (processedIdsRef.current.size > 200) {
        processedIdsRef.current = new Set([...processedIdsRef.current].slice(-80));
      }

      const me = myIdRef.current;
      if (!me || row.from === me) return;

      if (row.kind === "hangup" || row.kind === "reject") {
        if (callIdRef.current && row.callId !== callIdRef.current) return;
        playPersonTone(row.from, "call_end");
        clearTimers();
        stopMedia();
        closePeer();
        callIdRef.current = null;
        peerIdRef.current = null;
        answeredRef.current = false;
        connectedOnceRef.current = false;
        setIncoming(null);
        setPhase("ended");
        setStatusHint(row.kind === "reject" ? "Call declined" : "Call ended");
        window.setTimeout(() => {
          setTarget(null);
          setPhase("idle");
          setMode(null);
          setSeconds(0);
          setStatusHint("");
        }, 1000);
        return;
      }

      // Callee tapped Accept update caller UI immediately
      if (row.kind === "accepting") {
        if (callIdRef.current && row.callId !== callIdRef.current) return;
        answeredRef.current = true;
        if (ringFailTimerRef.current) {
          window.clearTimeout(ringFailTimerRef.current);
          ringFailTimerRef.current = null;
        }
        if (ringTimerRef.current) {
          window.clearInterval(ringTimerRef.current);
          ringTimerRef.current = null;
        }
        if (phaseRef.current !== "connected") {
          setPhase("connecting");
          setStatusHint("They picked up linking voice…");
        }
        scheduleIceFailWatch();
        return;
      }

      if (row.kind === "ice") {
        if (callIdRef.current && row.callId !== callIdRef.current) return;
        const cand = row.payload.candidate as RTCIceCandidateInit | undefined;
        if (!cand) return;
        const pc = pcRef.current;
        if (pc?.remoteDescription) {
          try {
            await pc.addIceCandidate(cand);
          } catch {
            pendingIceRef.current.push(cand);
          }
        } else {
          pendingIceRef.current.push(cand);
        }
        return;
      }

      if (row.kind === "answer") {
        if (callIdRef.current && row.callId !== callIdRef.current) return;
        const pc = pcRef.current;
        const sdp = row.payload.sdp as RTCSessionDescriptionInit | undefined;
        if (!pc || !sdp?.sdp) {
          console.warn("answer ignored: no pc or sdp", {
            hasPc: !!pc,
            hasSdp: !!sdp?.sdp,
          });
          return;
        }
        try {
          // Cancel ring→phone fallback peer answered
          answeredRef.current = true;
          if (ringFailTimerRef.current) {
            window.clearTimeout(ringFailTimerRef.current);
            ringFailTimerRef.current = null;
          }
          if (ringTimerRef.current) {
            window.clearInterval(ringTimerRef.current);
            ringTimerRef.current = null;
          }

          const state = pc.signalingState;
          if (
            state === "have-local-offer" ||
            state === "have-remote-pranswer"
          ) {
            // Do NOT munge remote SDP
            await pc.setRemoteDescription(asRemoteDesc(sdp));
            await flushIce(pc);
            setPhase("connecting");
            setStatusHint("They answered connecting voice…");
            scheduleIceFailWatch();
          } else if (state === "stable" && pc.currentRemoteDescription) {
            // Already applied
            setPhase("connecting");
            scheduleIceFailWatch();
          } else {
            console.warn("answer unexpected signalingState", state);
            // Try anyway
            try {
              await pc.setRemoteDescription(asRemoteDesc(sdp));
              await flushIce(pc);
              setPhase("connecting");
              scheduleIceFailWatch();
            } catch (e2) {
              console.warn("answer force set failed", e2);
            }
          }
        } catch (e) {
          console.warn("answer", e);
          if (!fallToPhone("Answer failed")) {
            setStatusHint("Could not connect try phone");
          }
        }
        return;
      }

      if (row.kind === "offer") {
        const p = phaseRef.current;
        // Allow offer while idle/ended; if already in a call with same id, ignore
        if (p !== "idle" && p !== "ended") {
          if (callIdRef.current === row.callId) return;
          return;
        }
        const rawSdp = row.payload.sdp as RTCSessionDescriptionInit | undefined;
        if (!rawSdp?.sdp) return;
        // Store remote SDP raw (no munge)
        const sdp = asRemoteDesc(rawSdp);
        const fromName = String(row.payload.fromName || "Caller");
        const fromPhoto = row.payload.fromPhoto
          ? String(row.payload.fromPhoto)
          : undefined;
        const fromRole = row.payload.fromRole
          ? String(row.payload.fromRole)
          : undefined;

        callIdRef.current = row.callId;
        peerIdRef.current = row.from;
        answeredRef.current = false;
        connectedOnceRef.current = false;
        setIncoming({
          callId: row.callId,
          from: row.from,
          fromName,
          fromPhoto,
          fromRole,
          sdp,
        });
        setPhase("ringing");
        setMode("webrtc");
        setTarget({
          name: fromName,
          photo: fromPhoto,
          roleLabel: fromRole || "Incoming",
          userId: row.from,
        });
        // Auto present full-screen ring on any screen while app is open
        unlockAudio();
        playPersonTone(row.from, "call_ring");
        notifyIncomingCall(fromName, row.callId);
        try {
          window.focus();
        } catch {
          /* */
        }
        if (ringTimerRef.current) window.clearInterval(ringTimerRef.current);
        ringTimerRef.current = window.setInterval(() => {
          if (phaseRef.current === "ringing") {
            unlockAudio();
            playPersonTone(row.from, "call_ring");
            vibrateCallPattern();
          }
        }, 2000);
      }
    },
    [
      processedIdsRef,
      myIdRef,
      callIdRef,
      peerIdRef,
      answeredRef,
      connectedOnceRef,
      ringFailTimerRef,
      ringTimerRef,
      phaseRef,
      pcRef,
      pendingIceRef,
      setIncoming,
      setPhase,
      setStatusHint,
      setTarget,
      setMode,
      setSeconds,
      clearTimers,
      closePeer,
      fallToPhone,
      flushIce,
      notifyIncomingCall,
      scheduleIceFailWatch,
      stopMedia,
    ],
  );

  return { processSignal };
}
