import { useEffect, type RefObject } from "react";
import { formatRemaining, getLivenessLock } from "@/lib/liveness/lockout";
import { livenessLog } from "@/lib/liveness/logger";
import { MODEL_URL, WASM_CDN } from "./constants";
import type { FaceLandmarkerInstance, LivenessPhase } from "./types";

type BootDeps = {
  userKey: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  streamRef: RefObject<MediaStream | null>;
  landmarkerRef: RefObject<FaceLandmarkerInstance | null>;
  rafRef: RefObject<number>;
  runningRef: RefObject<boolean>;
  stepStartedRef: RefObject<number>;
  sessionStartedRef: RefObject<number>;
  resetSession: () => void;
  setPhase: (p: LivenessPhase) => void;
  setLockMs: (n: number) => void;
  setFails: (n: number) => void;
  setErr: (s: string | null) => void;
  setFeedback: (s: string) => void;
  setReady: (b: boolean) => void;
  setModelReady: (b: boolean) => void;
};

type ReleaseRefs = Pick<
  BootDeps,
  "runningRef" | "rafRef" | "streamRef" | "landmarkerRef"
>;

/** Cleanup order: stop loop, cancel rAF, stop tracks, close landmarker. */
function releaseLivenessResources({
  runningRef,
  rafRef,
  streamRef,
  landmarkerRef,
}: ReleaseRefs) {
  runningRef.current = false;
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  streamRef.current?.getTracks().forEach((t) => t.stop());
  streamRef.current = null;
  try {
    landmarkerRef.current?.close?.();
  } catch {
    /* */
  }
  landmarkerRef.current = null;
}

/** Boot once: camera + MediaPipe (CDN float16 low data) */
export function useLivenessBoot({
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
}: BootDeps) {
  useEffect(() => {
    const lock = getLivenessLock(userKey);
    if (lock.locked) {
      setPhase("locked");
      setLockMs(lock.remainingMs);
      setFails(lock.fails);
      setErr(
        `Too many attempts. Try again in ${formatRemaining(lock.remainingMs)}.`,
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setPhase("boot");
        setFeedback("Starting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24, max: 30 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setReady(true);
        }

        setFeedback("Loading face model…");
        livenessLog("info", "model_load_start");
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_CDN);
        let landmarker: FaceLandmarkerInstance;
        try {
          landmarker = (await vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          })) as FaceLandmarkerInstance;
        } catch {
          landmarker = (await vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          })) as FaceLandmarkerInstance;
        }
        if (cancelled) {
          landmarker.close?.();
          return;
        }
        landmarkerRef.current = landmarker;
        setModelReady(true);
        livenessLog("info", "model_ready");
        resetSession();
        runningRef.current = true;
        sessionStartedRef.current = performance.now();
        stepStartedRef.current = performance.now();
      } catch (e) {
        livenessLog("error", "boot_failed", {
          message: e instanceof Error ? e.message : "unknown",
        });
        setErr(
          "Could not start face check. Allow camera access and try again.",
        );
        setPhase("fail");
      }
    })();

    return () => {
      cancelled = true;
      releaseLivenessResources({
        runningRef,
        rafRef,
        streamRef,
        landmarkerRef,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);
}
