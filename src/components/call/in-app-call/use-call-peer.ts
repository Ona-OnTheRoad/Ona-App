import { useCallback } from "react";
import {
  applyAudioSenderBitrate,
  DEFAULT_BITRATE_BPS,
} from "@/lib/webrtc-audio";
import { ICE_SERVERS } from "./helpers";
import type { CallLifecycle } from "./use-call-lifecycle";
import type { CallMedia } from "./use-call-media";
import type { CallRefs, CallSetters } from "./types";

/** Builds the RTCPeerConnection and wires its media / ICE event handlers. */
export function useCallPeer(
  refs: CallRefs,
  set: CallSetters,
  media: CallMedia,
  lifecycle: CallLifecycle,
) {
  const { peerIdRef, callIdRef, phaseRef, pcRef } = refs;
  const { setStatusHint, setPhase } = set;
  const { attachRemote, pushSignal } = media;
  const { fallToPhone, markConnected, scheduleIceFailWatch } = lifecycle;

  const createPeer = useCallback(
    (local: MediaStream) => {
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });

      local.getAudioTracks().forEach((track) => {
        pc.addTrack(track, local);
      });
      // Ensure bidirectional audio even if remote track late
      const hasAudioSend = pc
        .getTransceivers()
        .some(
          (t) =>
            t.receiver.track?.kind === "audio" ||
            t.sender.track?.kind === "audio",
        );
      if (!hasAudioSend) {
        try {
          pc.addTransceiver("audio", { direction: "sendrecv" });
        } catch {
          /* */
        }
      }

      pc.ontrack = (ev) => {
        if (ev.track && ev.track.kind !== "audio") {
          try {
            ev.track.stop();
          } catch {
            /* */
          }
          return;
        }
        const stream =
          ev.streams[0] || (ev.track ? new MediaStream([ev.track]) : null);
        if (stream) {
          attachRemote(stream);
          // Media path = connected even if ICE state lags
          markConnected();
        }
        if (ev.track) {
          ev.track.onunmute = () => {
            if (stream) attachRemote(stream);
            markConnected();
          };
        }
      };

      pc.onicecandidate = (ev) => {
        const peer = peerIdRef.current;
        const callId = callIdRef.current;
        if (!ev.candidate || !peer || !callId) return;
        void pushSignal(peer, "ice", callId, {
          candidate: ev.candidate.toJSON(),
        });
      };

      pc.oniceconnectionstatechange = () => {
        const st = pc.iceConnectionState;
        if (st === "connected" || st === "completed") {
          markConnected();
        } else if (st === "failed") {
          // One more ICE restart before phone fallback
          try {
            pc.restartIce();
            setStatusHint("Reconnecting voice…");
            scheduleIceFailWatch();
          } catch {
            if (!fallToPhone("WebRTC ICE failed")) {
              setStatusHint("Connection failed try Call on phone");
            }
          }
        } else if (st === "disconnected") {
          setStatusHint("Connection weak reconnecting…");
          try {
            pc.restartIce();
          } catch {
            /* */
          }
          scheduleIceFailWatch();
        } else if (st === "checking") {
          if (phaseRef.current !== "connected") {
            setPhase("connecting");
            setStatusHint("Connecting voice…");
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") markConnected();
        if (pc.connectionState === "failed") {
          try {
            pc.restartIce();
            setStatusHint("Retrying connection…");
            scheduleIceFailWatch();
          } catch {
            if (!fallToPhone("Connection failed")) {
              setStatusHint("Connection failed try Call on phone");
            }
          }
        }
        if (pc.connectionState === "disconnected") {
          setStatusHint("Reconnecting… keep both screens open");
          try {
            pc.restartIce();
          } catch {
            /* */
          }
        }
      };

      pcRef.current = pc;
      void applyAudioSenderBitrate(pc, DEFAULT_BITRATE_BPS);
      return pc;
    },
    [
      peerIdRef,
      callIdRef,
      phaseRef,
      pcRef,
      setStatusHint,
      setPhase,
      attachRemote,
      fallToPhone,
      markConnected,
      pushSignal,
      scheduleIceFailWatch,
    ],
  );

  return { createPeer };
}
