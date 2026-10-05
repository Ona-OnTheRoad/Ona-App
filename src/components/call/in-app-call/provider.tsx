"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useApp } from "@/lib/store";
import { CallSheet } from "./call-sheet";
import { CallContext } from "./call-context";
import { getPhaseLabel } from "./helpers";
import type {
  CallMode,
  CallPhase,
  CallSetters,
  CallTarget,
  IncomingCall,
} from "./types";
import { useCallInbox } from "./use-call-inbox";
import { useCallLifecycle } from "./use-call-lifecycle";
import { useCallMedia } from "./use-call-media";
import { useCallPeer } from "./use-call-peer";
import { useCallRefs } from "./use-call-refs";
import { useIncomingActions } from "./use-incoming-actions";
import { useOutgoingActions } from "./use-outgoing-actions";
import { useProcessSignal } from "./use-process-signal";

export function InAppCallProvider({ children }: { children: ReactNode }) {
  const { theme, backendUserId, displayName, userProfile, accountType } =
    useApp();
  const isLight = theme === "light";
  const myName = userProfile?.fullName?.trim() || displayName || "Ona user";
  const myPhoto = userProfile?.avatarUrl || "";
  const myRole = accountType === "professional" ? "Repair Pro" : "Customer";

  const [target, setTarget] = useState<CallTarget | null>(null);
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [mode, setMode] = useState<CallMode>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [statusHint, setStatusHint] = useState("");
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);

  const refs = useCallRefs();
  const { streamRef, remoteAudioRef, phaseRef, myIdRef } = refs;
  const set: CallSetters = useMemo(
    () => ({
      setTarget,
      setPhase,
      setMode,
      setSeconds,
      setMuted,
      setSpeaker,
      setStatusHint,
      setIncoming,
    }),
    [],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase, phaseRef]);
  useEffect(() => {
    myIdRef.current = backendUserId;
  }, [backendUserId, myIdRef]);

  useEffect(() => {
    setMount(document.getElementById("ona-phone") || document.body);
  }, []);

  const media = useCallMedia(refs);
  const { clearTimers, stopMedia, closePeer } = media;
  const lifecycle = useCallLifecycle(refs, set, media);
  const { endCall } = lifecycle;
  const { createPeer } = useCallPeer(refs, set, media, lifecycle);
  const { processSignal } = useProcessSignal(refs, set, media, lifecycle);

  useCallInbox(backendUserId, processSignal);

  const { acceptIncoming, rejectIncoming } = useIncomingActions(
    refs,
    set,
    media,
    lifecycle,
    createPeer,
    incoming,
    backendUserId,
  );
  const { startPhoneCall, startCall } = useOutgoingActions(
    refs,
    set,
    media,
    lifecycle,
    createPeer,
    backendUserId,
    { myName, myPhoto, myRole },
  );

  useEffect(() => {
    return () => {
      clearTimers();
      stopMedia();
      closePeer();
      if (remoteAudioRef.current) {
        try {
          remoteAudioRef.current.remove();
        } catch {
          /* */
        }
        remoteAudioRef.current = null;
      }
    };
  }, [clearTimers, closePeer, stopMedia, remoteAudioRef]);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !muted;
    });
  }, [muted, streamRef]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = speaker ? 1 : 0.12;
    }
  }, [speaker, remoteAudioRef]);

  const value = useMemo(
    () => ({
      startCall,
      endCall: () => void endCall(),
      active: phase !== "idle" && phase !== "ended",
    }),
    [startCall, endCall, phase],
  );

  const phaseLabel = getPhaseLabel(phase, incoming, seconds);

  const onToggleMute = useCallback(() => setMuted((m) => !m), []);
  const onToggleSpeaker = useCallback(() => setSpeaker((s) => !s), []);

  const sheet =
    phase !== "idle" && target && mount ? (
      <CallSheet
        mount={mount}
        isLight={isLight}
        phase={phase}
        mode={mode}
        target={target}
        incoming={incoming}
        phaseLabel={phaseLabel}
        statusHint={statusHint}
        muted={muted}
        speaker={speaker}
        onToggleMute={onToggleMute}
        onToggleSpeaker={onToggleSpeaker}
        onEnd={() => void endCall()}
        onAccept={() => void acceptIncoming()}
        onReject={() => void rejectIncoming()}
        onCallPhone={startPhoneCall}
      />
    ) : null;

  return (
    <CallContext.Provider value={value}>
      {children}
      {sheet}
    </CallContext.Provider>
  );
}
