import type { RefObject } from "react";
import { formatRemaining, getLivenessLock } from "@/lib/liveness/lockout";
import { MODEL_URL, WASM_CDN } from "./constants";
import type { FaceLandmarkerInstance, LivenessPhase } from "./types";

type RetryDeps = {
  phase: LivenessPhase;
  userKey: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  streamRef: RefObject<MediaStream | null>;
  landmarkerRef: RefObject<FaceLandmarkerInstance | null>;
  runningRef: RefObject<boolean>;
  resetSession: () => void;
  setPhase: (p: LivenessPhase) => void;
  setLockMs: (n: number) => void;
  setErr: (s: string | null) => void;
  setFeedback: (s: string) => void;
  setReady: (b: boolean) => void;
  setModelReady: (b: boolean) => void;
};

/** "Try again" handler: re-acquire camera/model if needed, then reset. */
export function retryLivenessSession({
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
}: RetryDeps) {
  if (phase === "locked") return;
  const lock = getLivenessLock(userKey);
  if (lock.locked) {
    setPhase("locked");
    setLockMs(lock.remainingMs);
    setErr(
      `Too many attempts. Try again in ${formatRemaining(lock.remainingMs)}.`,
    );
    return;
  }
  setErr(null);
  (async () => {
    try {
      setPhase("boot");
      setFeedback("Restarting…");
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      }
      setReady(true);
      if (!landmarkerRef.current) {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_CDN);
        landmarkerRef.current = (await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          },
        )) as FaceLandmarkerInstance;
      }
      setModelReady(true);
      runningRef.current = true;
      resetSession();
    } catch {
      setErr("Camera unavailable. Check permissions.");
      setPhase("fail");
    }
  })();
}
