import { useCallback } from "react";
import { ensureNotifyPermission, waitIceGathering } from "@/lib/app-notify";
import { playPersonTone, unlockAudio } from "@/lib/sound-tone";
import {
  DEFAULT_BITRATE_BPS,
  descriptionWithMungedSdp,
} from "@/lib/webrtc-audio";
import { isUuid, newCallId, openTelDialer } from "./helpers";
import type { CallLifecycle } from "./use-call-lifecycle";
import type { CallMedia } from "./use-call-media";
import type { CallRefs, CallSetters, CallTarget } from "./types";

type Identity = { myName: string; myPhoto: string; myRole: string };

/** Starting calls: phone dialer, WebRTC offer, and the public startCall entry. */
export function useOutgoingActions(
  refs: CallRefs,
  set: CallSetters,
  media: CallMedia,
  lifecycle: CallLifecycle,
  createPeer: (local: MediaStream) => RTCPeerConnection,
  backendUserId: string | null,
  { myName, myPhoto, myRole }: Identity,
) {
  const {
    phoneRef,
    answeredRef,
    connectedOnceRef,
    timerRef,
    callIdRef,
    peerIdRef,
    ringTimerRef,
    ringFailTimerRef,
    phaseRef,
  } = refs;
  const { setTarget, setMode, setPhase, setSeconds, setStatusHint, setIncoming } =
    set;
  const { clearTimers, stopMedia, closePeer, ensureMic, pushSignal } = media;
  const { fallToPhone, endCall } = lifecycle;

  const startPhoneCall = useCallback(
    (t: CallTarget) => {
      const phone = (t.phone || "").replace(/[^\d+]/g, "");
      if (!phone) {
        setStatusHint("No phone number on file");
        return;
      }
      unlockAudio();
      phoneRef.current = phone;
      clearTimers();
      stopMedia();
      closePeer();
      answeredRef.current = false;
      connectedOnceRef.current = false;
      setTarget({ ...t, phone });
      setMode("phone");
      setPhase("dialing");
      setSeconds(0);
      setStatusHint("Opening phone dialer…");
      window.setTimeout(() => {
        openTelDialer(phone);
        setPhase("connected");
        setStatusHint("Phone dialer open");
        timerRef.current = window.setInterval(
          () => setSeconds((s) => s + 1),
          1000,
        );
      }, 300);
    },
    [
      phoneRef,
      answeredRef,
      connectedOnceRef,
      timerRef,
      setStatusHint,
      setTarget,
      setMode,
      setPhase,
      setSeconds,
      clearTimers,
      closePeer,
      stopMedia,
    ],
  );

  const startWebRtcCall = useCallback(
    async (t: CallTarget) => {
      if (!backendUserId || !t.userId || !isUuid(t.userId)) {
        if (t.phone) {
          startPhoneCall(t);
          return true;
        }
        return false;
      }
      unlockAudio();
      void ensureNotifyPermission();
      clearTimers();
      stopMedia();
      closePeer();

      const callId = newCallId();
      callIdRef.current = callId;
      peerIdRef.current = t.userId;
      phoneRef.current = (t.phone || "").replace(/[^\d+]/g, "");
      answeredRef.current = false;
      connectedOnceRef.current = false;
      setTarget(t);
      setMode("webrtc");
      setPhase("dialing");
      setSeconds(0);
      setStatusHint("Starting in-app call…");
      setIncoming(null);

      const local = await ensureMic();
      if (!local) {
        if (phoneRef.current) {
          startPhoneCall(t);
          return true;
        }
        setStatusHint("Microphone permission needed");
        setPhase("ended");
        window.setTimeout(() => {
          setPhase("idle");
          setTarget(null);
        }, 1500);
        return false;
      }

      const pc = createPeer(local);
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        const mungedOffer = descriptionWithMungedSdp(
          offer,
          DEFAULT_BITRATE_BPS,
        );
        await pc.setLocalDescription(mungedOffer);
        await waitIceGathering(pc, 2000);

        setPhase("ringing");
        setStatusHint("Ringing… they can pick up on any Ona screen");
        playPersonTone(t.userId, "call_ring");
        ringTimerRef.current = window.setInterval(() => {
          if (phaseRef.current === "ringing") {
            playPersonTone(t.userId!, "call_ring");
          }
        }, 2200);

        const sdp = pc.localDescription || mungedOffer;
        const err = await pushSignal(t.userId, "offer", callId, {
          sdp: {
            type: sdp.type,
            sdp: sdp.sdp,
          },
          fromName: myName,
          fromPhoto: myPhoto || null,
          fromRole: myRole,
        });
        if (err) {
          console.error("offer signal failed", err);
          if (phoneRef.current) {
            fallToPhone(`Signal error: ${err}`);
            return true;
          }
          setStatusHint(err);
          void endCall();
          return false;
        }

        setStatusHint("Ringing… keep your app open");

        // Only fall to phone if they NEVER pick up (still ringing/dialing)
        ringFailTimerRef.current = window.setTimeout(() => {
          if (
            phaseRef.current === "ringing" ||
            phaseRef.current === "dialing"
          ) {
            if (!answeredRef.current) {
              if (!fallToPhone("No answer in-app opening phone dialer")) {
                setStatusHint(
                  "No answer. Ask them to open Ona, or use Message.",
                );
              }
            }
          }
        }, 22_000);

        return true;
      } catch (e) {
        console.warn("offer", e);
        if (phoneRef.current) {
          fallToPhone("Could not start WebRTC");
          return true;
        }
        void endCall();
        return false;
      }
    },
    [
      backendUserId,
      phoneRef,
      answeredRef,
      connectedOnceRef,
      callIdRef,
      peerIdRef,
      ringTimerRef,
      ringFailTimerRef,
      phaseRef,
      setTarget,
      setMode,
      setPhase,
      setSeconds,
      setStatusHint,
      setIncoming,
      clearTimers,
      closePeer,
      createPeer,
      endCall,
      ensureMic,
      fallToPhone,
      myName,
      myPhoto,
      myRole,
      pushSignal,
      startPhoneCall,
      stopMedia,
    ],
  );

  const startCall = useCallback(
    (t: CallTarget) => {
      unlockAudio();
      void ensureNotifyPermission();
      const peerOk = Boolean(t.userId && isUuid(t.userId) && backendUserId);
      const phoneOk = Boolean((t.phone || "").replace(/[^\d+]/g, ""));

      if (peerOk) {
        void startWebRtcCall(t);
        return;
      }
      if (phoneOk) {
        startPhoneCall(t);
        return;
      }
      setTarget(t);
      setPhase("ended");
      setStatusHint("No phone or in-app peer on file");
      window.setTimeout(() => {
        setPhase("idle");
        setTarget(null);
      }, 1800);
    },
    [
      backendUserId,
      setTarget,
      setPhase,
      setStatusHint,
      startPhoneCall,
      startWebRtcCall,
    ],
  );

  return { startPhoneCall, startCall };
}
