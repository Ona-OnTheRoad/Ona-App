import type { Dispatch, RefObject, SetStateAction } from "react";

export type CallTarget = {
  name: string;
  phone?: string;
  photo?: string;
  roleLabel?: string;
  userId?: string;
  jobId?: string;
};

export type CallPhase =
  "idle" | "dialing" | "ringing" | "connecting" | "connected" | "ended";

export type CallMode = "webrtc" | "phone" | null;

export type CallContextValue = {
  startCall: (target: CallTarget) => void;
  endCall: () => void;
  active: boolean;
};

export type IncomingCall = {
  callId: string;
  from: string;
  fromName: string;
  fromPhoto?: string;
  fromRole?: string;
  sdp: RTCSessionDescriptionInit;
};

export type SignalKind =
  "offer" | "answer" | "ice" | "hangup" | "reject" | "accepting";

/** All mutable refs shared by the call hooks. */
export type CallRefs = {
  streamRef: RefObject<MediaStream | null>;
  remoteAudioRef: RefObject<HTMLAudioElement | null>;
  pcRef: RefObject<RTCPeerConnection | null>;
  callIdRef: RefObject<string | null>;
  peerIdRef: RefObject<string | null>;
  phoneRef: RefObject<string>;
  timerRef: RefObject<number | null>;
  ringFailTimerRef: RefObject<number | null>;
  iceFailTimerRef: RefObject<number | null>;
  ringTimerRef: RefObject<number | null>;
  bitrateStopRef: RefObject<(() => void) | null>;
  pendingIceRef: RefObject<RTCIceCandidateInit[]>;
  phaseRef: RefObject<CallPhase>;
  myIdRef: RefObject<string | null>;
  processedIdsRef: RefObject<Set<string>>;
  /** True after answer SDP applied (caller) or Accept (callee) block phone fallback */
  answeredRef: RefObject<boolean>;
  connectedOnceRef: RefObject<boolean>;
};

/** State setters (stable identities) shared by the call hooks. */
export type CallSetters = {
  setTarget: Dispatch<SetStateAction<CallTarget | null>>;
  setPhase: Dispatch<SetStateAction<CallPhase>>;
  setMode: Dispatch<SetStateAction<CallMode>>;
  setSeconds: Dispatch<SetStateAction<number>>;
  setMuted: Dispatch<SetStateAction<boolean>>;
  setSpeaker: Dispatch<SetStateAction<boolean>>;
  setStatusHint: Dispatch<SetStateAction<string>>;
  setIncoming: Dispatch<SetStateAction<IncomingCall | null>>;
};
