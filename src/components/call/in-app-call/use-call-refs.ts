import { useRef } from "react";
import type { CallPhase, CallRefs } from "./types";

export function useCallRefs(): CallRefs {
  const streamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const phoneRef = useRef<string>("");
  const timerRef = useRef<number | null>(null);
  const ringFailTimerRef = useRef<number | null>(null);
  const iceFailTimerRef = useRef<number | null>(null);
  const ringTimerRef = useRef<number | null>(null);
  const bitrateStopRef = useRef<(() => void) | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const phaseRef = useRef<CallPhase>("idle");
  const myIdRef = useRef<string | null>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());
  const answeredRef = useRef(false);
  const connectedOnceRef = useRef(false);
  return {
    streamRef,
    remoteAudioRef,
    pcRef,
    callIdRef,
    peerIdRef,
    phoneRef,
    timerRef,
    ringFailTimerRef,
    iceFailTimerRef,
    ringTimerRef,
    bitrateStopRef,
    pendingIceRef,
    phaseRef,
    myIdRef,
    processedIdsRef,
    answeredRef,
    connectedOnceRef,
  };
}
