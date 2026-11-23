import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearLivenessFails,
  formatRemaining,
  getLivenessLock,
  LIVENESS_MAX_FAILS,
  recordLivenessFail,
} from "@/lib/liveness/lockout";
import { livenessLog } from "@/lib/liveness/logger";
import { SESSION_LEN } from "./constants";
import { createDetectionTick } from "./detection-tick";
import { pickChallenges, type TimedSample } from "./helpers";
import type {
  Challenge,
  FaceLandmarkerInstance,
  LivenessLm,
  LivenessPhase,
} from "./types";
import { retryLivenessSession } from "./retry-session";
import { useLivenessBoot } from "./use-liveness-boot";
import { useLockCountdown } from "./use-lock-countdown";
import { captureSelfie, submitLivenessSelfie } from "./submit-selfie";

type Params = {
  onPassed: () => void;
  onCancel: () => void;
  userKey: string;
  userId?: string;
  /** Tier 3: capture a selfie and require the server's provider verdict. */
  serverVerify?: boolean;
};

export function useFaceLiveness({
  onPassed,
  onCancel,
  userKey,
  userId,
  serverVerify = false,
}: Params) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const rafRef = useRef<number>(0);
  const challengesRef = useRef<Challenge[]>(pickChallenges(SESSION_LEN));
  const stepRef = useRef(0);
  const stepStartedRef = useRef(0);
  const sessionStartedRef = useRef(0);
  const passedStepsRef = useRef<boolean[]>(
    Array.from({ length: SESSION_LEN }, () => false),
  );
  const earHistRef = useRef<number[]>([]);
  const yawHistRef = useRef<TimedSample[]>([]);
  const pitchHistRef = useRef<TimedSample[]>([]);
  const tiltHistRef = useRef<TimedSample[]>([]);
  const facePresentFramesRef = useRef(0);
  const faceMissingFramesRef = useRef(0);
  const motionEnergyRef = useRef(0);
  const lastLmRef = useRef<LivenessLm | null>(null);
  const runningRef = useRef(false);

  const [challenges, setChallenges] = useState(() =>
    pickChallenges(SESSION_LEN),
  );
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("Hold your face in the circle");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<LivenessPhase>("boot");
  const [fails, setFails] = useState(0);
  // Live lock countdown; when it ends, offer "Try again".
  const { lockMs, setLockMs, lockLabel: lockMinutes } = useLockCountdown(
    phase,
    () => {
      setErr("You can try again now.");
      setPhase("fail");
    },
  );

  const stopCamera = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resetSession = useCallback(() => {
    const next = pickChallenges(SESSION_LEN);
    challengesRef.current = next;
    setChallenges(next);
    stepRef.current = 0;
    setStep(0);
    passedStepsRef.current = Array.from({ length: SESSION_LEN }, () => false);
    earHistRef.current = [];
    yawHistRef.current = [];
    pitchHistRef.current = [];
    tiltHistRef.current = [];
    facePresentFramesRef.current = 0;
    faceMissingFramesRef.current = 0;
    motionEnergyRef.current = 0;
    lastLmRef.current = null;
    setProgress(0);
    setFeedback(next[0]?.label || "Look at the camera");
    setErr(null);
    setPhase("run");
    stepStartedRef.current = performance.now();
    sessionStartedRef.current = performance.now();
    livenessLog("info", "session_reset", {
      challenges: next.map((c) => c.id),
    });
  }, []);

  // Lockout check
  useEffect(() => {
    const lock = getLivenessLock(userKey);
    setFails(lock.fails);
    if (lock.locked) {
      setPhase("locked");
      setLockMs(lock.remainingMs);
      setErr(
        `Too many attempts. Try again in ${formatRemaining(lock.remainingMs)}.`,
      );
      livenessLog("warn", "locked", { remainingMs: lock.remainingMs });
    }
  }, [setLockMs, userKey]);

  // Boot once: camera + MediaPipe (CDN float16 low data)
  useLivenessBoot({
    userKey,
    videoRef,
    streamRef,
    landmarkerRef,
    rafRef,
    runningRef,
    stepStartedRef,
    sessionStartedRef,
    resetSession,
    setPhase,
    setLockMs,
    setFails,
    setErr,
    setFeedback,
    setReady,
    setModelReady,
  });

  const failSession = useCallback(
    (reason: string) => {
      runningRef.current = false;
      const r = recordLivenessFail(userKey);
      setFails(r.fails);
      livenessLog("warn", "session_fail", { reason, fails: r.fails });
      if (r.locked) {
        setPhase("locked");
        setLockMs(r.remainingMs);
        setErr(
          `Too many attempts. Try again in ${formatRemaining(r.remainingMs)}.`,
        );
        stopCamera();
        return;
      }
      setPhase("fail");
      setErr(`${reason} Attempt ${r.fails} of ${LIVENESS_MAX_FAILS}.`);
    },
    [setLockMs, stopCamera, userKey],
  );

  const pass = useCallback(() => {
    clearLivenessFails(userKey);
    setPhase("success");
    setFeedback("Verified");
    setProgress(100);
    window.setTimeout(() => {
      stopCamera();
      onPassed();
    }, 1400);
  }, [onPassed, stopCamera, userKey]);

  const succeed = useCallback(() => {
    runningRef.current = false;
    const challenges = challengesRef.current.map((c) => c.id);
    const durationMs = Math.round(performance.now() - sessionStartedRef.current);
    livenessLog("info", "session_pass", { challenges, durationMs, serverVerify });
    // Local-only gate (e.g. name change): the challenge alone is enough.
    if (!serverVerify) return pass();
    const selfie = captureSelfie(videoRef.current);
    if (!userId || !selfie) {
      setPhase("fail");
      setErr(
        userId
          ? "Could not capture a photo. Try again in good light."
          : "Sign in again to verify your face.",
      );
      return;
    }
    // Tier 3: only the server's provider verdict counts.
    setPhase("verifying");
    setFeedback("Checking your photo…");
    void submitLivenessSelfie({ userId, selfie, challenges, durationMs }).then(
      (r) => {
        if (r.ok) return pass();
        livenessLog("warn", "server_reject", { countsAsFail: r.countsAsFail });
        if (r.retryAfterSec) {
          // Server attempt budget spent: show a live countdown, like the local lock.
          stopCamera();
          setLockMs(r.retryAfterSec * 1000);
          setPhase("locked");
          return;
        }
        if (r.countsAsFail) return failSession(r.message);
        setPhase("fail");
        setErr(r.message);
      },
    );
  }, [failSession, pass, serverVerify, setLockMs, stopCamera, userId]);

  // Detection loop
  useEffect(() => {
    if (!ready || !modelReady || phase !== "run") return;

    const tick = createDetectionTick({
      videoRef,
      landmarkerRef,
      rafRef,
      challengesRef,
      stepRef,
      stepStartedRef,
      sessionStartedRef,
      passedStepsRef,
      earHistRef,
      yawHistRef,
      pitchHistRef,
      tiltHistRef,
      facePresentFramesRef,
      faceMissingFramesRef,
      motionEnergyRef,
      lastLmRef,
      runningRef,
      setProgress,
      setFeedback,
      setStep,
      failSession,
      succeed,
    });

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, modelReady, phase, failSession, succeed]);

  const onRetry = () =>
    retryLivenessSession({
      phase,
      userKey,
      videoRef,
      streamRef,
      landmarkerRef,
      runningRef,
      resetSession,
      setPhase,
      setLockMs,
      setErr,
      setFeedback,
      setReady,
      setModelReady,
    });

  /** Stop the camera, then notify the parent (shared by Close / Cancel). */
  const cancelAndClose = () => {
    stopCamera();
    onCancel();
  };

  return {
    videoRef,
    step,
    feedback,
    progress,
    ready,
    modelReady,
    err:
      phase === "locked" && lockMs > 0
        ? `Too many attempts. Try again in ${lockMinutes}.`
        : err,
    phase,
    lockMinutes,
    onRetry,
    cancelAndClose,
    // retained for parity with the original state set
    challenges,
    fails,
  };
}
