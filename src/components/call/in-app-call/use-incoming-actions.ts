import { useCallback } from "react";
import { waitIceGathering } from "@/lib/app-notify";
import { unlockAudio } from "@/lib/sound-tone";
import {
  DEFAULT_BITRATE_BPS,
  descriptionWithMungedSdp,
} from "@/lib/webrtc-audio";
import { asRemoteDesc } from "./helpers";
import type { CallLifecycle } from "./use-call-lifecycle";
import type { CallMedia } from "./use-call-media";
import type { CallRefs, CallSetters, IncomingCall } from "./types";

/** Accept / Decline for an incoming call. */
export function useIncomingActions(
  refs: CallRefs,
  set: CallSetters,
  media: CallMedia,
  lifecycle: CallLifecycle,
  createPeer: (local: MediaStream) => RTCPeerConnection,
  incoming: IncomingCall | null,
  backendUserId: string | null,
) {
  const { ringTimerRef, answeredRef, callIdRef, peerIdRef, connectedOnceRef } =
    refs;
  const { setPhase, setStatusHint, setIncoming, setTarget, setMode } = set;
  const { pushSignal, ensureMic, flushIce, closePeer } = media;
  const { endCall, fallToPhone, scheduleIceFailWatch } = lifecycle;

  const acceptIncoming = useCallback(async () => {
    if (!incoming || !backendUserId) return;
    unlockAudio();
    if (ringTimerRef.current) {
      window.clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    answeredRef.current = true;
    setPhase("connecting");
    setStatusHint("Answering…");
    callIdRef.current = incoming.callId;
    peerIdRef.current = incoming.from;

    // Tell caller immediately that we picked up (fixes "one side still ringing")
    void pushSignal(incoming.from, "accepting", incoming.callId, {});

    const local = await ensureMic();
    if (!local) {
      setStatusHint("Allow microphone to answer");
      setPhase("ringing");
      answeredRef.current = false;
      return;
    }

    const pc = createPeer(local);
    try {
      // Remote offer as-is
      await pc.setRemoteDescription(asRemoteDesc(incoming.sdp));
      await flushIce(pc);
      const answer = await pc.createAnswer();
      const mungedAnswer = descriptionWithMungedSdp(
        answer,
        DEFAULT_BITRATE_BPS,
      );
      await pc.setLocalDescription(mungedAnswer);
      // Gather some candidates into SDP + trickle the rest
      await waitIceGathering(pc, 2000);
      const localDesc = pc.localDescription || mungedAnswer;
      const err = await pushSignal(incoming.from, "answer", incoming.callId, {
        sdp: { type: localDesc.type, sdp: localDesc.sdp },
      });
      if (err) {
        console.error("answer signal failed", err);
        setStatusHint(err);
      }
      setIncoming(null);
      setStatusHint("Connecting voice… keep both apps open");
      scheduleIceFailWatch();
    } catch (e) {
      console.warn("accept", e);
      if (!fallToPhone("Answer failed")) {
        setStatusHint("Could not answer");
        void endCall();
      }
    }
  }, [
    backendUserId,
    ringTimerRef,
    answeredRef,
    callIdRef,
    peerIdRef,
    setPhase,
    setStatusHint,
    setIncoming,
    createPeer,
    endCall,
    ensureMic,
    fallToPhone,
    flushIce,
    incoming,
    pushSignal,
    scheduleIceFailWatch,
  ]);

  const rejectIncoming = useCallback(async () => {
    if (incoming) {
      void pushSignal(incoming.from, "reject", incoming.callId, {});
    }
    if (ringTimerRef.current) {
      window.clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    setIncoming(null);
    setPhase("idle");
    setTarget(null);
    setMode(null);
    callIdRef.current = null;
    peerIdRef.current = null;
    answeredRef.current = false;
    connectedOnceRef.current = false;
    closePeer();
  }, [
    ringTimerRef,
    callIdRef,
    peerIdRef,
    answeredRef,
    connectedOnceRef,
    setIncoming,
    setPhase,
    setTarget,
    setMode,
    closePeer,
    incoming,
    pushSignal,
  ]);

  return { acceptIncoming, rejectIncoming };
}
