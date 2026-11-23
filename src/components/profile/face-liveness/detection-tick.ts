import type { RefObject } from "react";
import { livenessLog } from "@/lib/liveness/logger";
import { SESSION_LEN, SESSION_TARGET_MS, STEP_MS } from "./constants";
import {
  blendScore,
  dist3,
  eyeAspectRatio,
  headPose,
  headTiltRatio,
  headTurnSide,
  pushTimed,
  TILT_MIN,
  timedExtent,
  TURN_SIDE_MIN,
  timedRange,
  type TimedSample,
} from "./helpers";
import type { Challenge, FaceLandmarkerInstance, LivenessLm } from "./types";

export type DetectionTickDeps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarkerRef: RefObject<FaceLandmarkerInstance | null>;
  rafRef: RefObject<number>;
  challengesRef: RefObject<Challenge[]>;
  stepRef: RefObject<number>;
  stepStartedRef: RefObject<number>;
  sessionStartedRef: RefObject<number>;
  passedStepsRef: RefObject<boolean[]>;
  earHistRef: RefObject<number[]>;
  /** Head yaw / pitch over the last POSE_WINDOW_MS (time-based, not frames). */
  yawHistRef: RefObject<TimedSample[]>;
  pitchHistRef: RefObject<TimedSample[]>;
  /** Landmark head tilt (headTiltRatio) over the same window. */
  tiltHistRef: RefObject<TimedSample[]>;
  facePresentFramesRef: RefObject<number>;
  faceMissingFramesRef: RefObject<number>;
  motionEnergyRef: RefObject<number>;
  lastLmRef: RefObject<LivenessLm | null>;
  runningRef: RefObject<boolean>;
  setProgress: (n: number) => void;
  setFeedback: (s: string) => void;
  setStep: (n: number) => void;
  failSession: (reason: string) => void;
  succeed: () => void;
};

/** Builds the per-frame detection callback used by the rAF loop. */
export function createDetectionTick(deps: DetectionTickDeps) {
  const {
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
  } = deps;

  const tick = () => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const lm = landmarkerRef.current;
    if (!video || !lm || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const now = performance.now();
    let result;
    try {
      result = lm.detectForVideo(video, now);
    } catch {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const faces = result.faceLandmarks || [];
    const face = faces[0];

    // Overall progress by time + steps
    const sessionAge = now - sessionStartedRef.current;
    const timeProg = Math.min(0.55, sessionAge / SESSION_TARGET_MS);
    const stepProg =
      (stepRef.current + (passedStepsRef.current[stepRef.current] ? 1 : 0.35)) /
      SESSION_LEN;
    setProgress(
      Math.min(99, Math.round((timeProg * 0.35 + stepProg * 0.65) * 100)),
    );

    if (!face || face.length < 100) {
      faceMissingFramesRef.current += 1;
      facePresentFramesRef.current = Math.max(
        0,
        facePresentFramesRef.current - 1,
      );
      if (faceMissingFramesRef.current > 45) {
        setFeedback("No face detected center your face");
      }
      if (faceMissingFramesRef.current > 120) {
        failSession("We lost your face.");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    faceMissingFramesRef.current = 0;
    facePresentFramesRef.current += 1;

    // Lighting / size heuristic: face box span
    const xs = face.map((p) => p.x);
    const ys = face.map((p) => p.y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    if (spanX < 0.12 || spanY < 0.12) {
      setFeedback("Move closer to the camera");
    } else if (spanX > 0.75) {
      setFeedback("Move a little farther back");
    }

    // Motion energy (anti static photo)
    if (lastLmRef.current) {
      let e = 0;
      for (let i = 0; i < face.length; i += 8) {
        const a = face[i];
        const b = lastLmRef.current[i];
        if (a && b) e += dist3(a, b);
      }
      motionEnergyRef.current = motionEnergyRef.current * 0.85 + e * 0.15;
    }
    lastLmRef.current = face;

    const shapes = result.faceBlendshapes?.[0]?.categories;
    const pose = headPose(result.facialTransformationMatrixes?.[0]);
    const ear = eyeAspectRatio(face);
    earHistRef.current.push(ear);
    if (earHistRef.current.length > 18) earHistRef.current.shift();
    pushTimed(yawHistRef.current, now, pose.yaw);
    pushTimed(pitchHistRef.current, now, pose.pitch);
    const tilt = headTiltRatio(face);
    if (tilt !== null) pushTimed(tiltHistRef.current, now, tilt);

    const ch = challengesRef.current[stepRef.current];
    if (!ch) {
      succeed();
      return;
    }

    const blinkL = blendScore(shapes, "eyeBlinkLeft");
    const blinkR = blendScore(shapes, "eyeBlinkRight");
    const smile =
      (blendScore(shapes, "mouthSmileLeft") +
        blendScore(shapes, "mouthSmileRight")) /
      2;
    const ears = earHistRef.current;
    const earMin = Math.min(...ears);
    const earMax = Math.max(...ears);
    const yaw = pose.yaw;
    const turnSide = headTurnSide(face);
    // Up/down relative to where the head was in the last POSE_WINDOW_MS.
    const tiltSpan = timedExtent(tiltHistRef.current);
    const tiltedUp = tilt === null ? 0 : tiltSpan.max - tilt;
    const tiltedDown = tilt === null ? 0 : tilt - tiltSpan.min;
    const yawRange = timedRange(yawHistRef.current);
    const pitchRange = timedRange(pitchHistRef.current);

    let passed = false;
    switch (ch.id) {
      case "blink":
        passed =
          (blinkL > 0.45 && blinkR > 0.45) ||
          (earMax - earMin > 0.045 && earMin < 0.18);
        break;
      case "smile":
        passed = smile > 0.35;
        break;
      // Size of the turn from the pose (|yaw|), direction from landmarks.
      case "turn_left":
        passed = Math.abs(yaw) > 0.18 && turnSide > TURN_SIDE_MIN;
        break;
      case "turn_right":
        passed = Math.abs(yaw) > 0.18 && turnSide < -TURN_SIDE_MIN;
        break;
      case "nod":
        passed = pitchRange > 0.2 || tiltSpan.max - tiltSpan.min > TILT_MIN * 2;
        break;
      // Direction and size from landmarks, relative to the person's own
      // recent position (not a fixed level; a phone held low tilts the head).
      case "look_up":
        passed = tiltedUp > TILT_MIN;
        break;
      case "look_down":
        passed = tiltedDown > TILT_MIN;
        break;
    }

    // Anti-spoof: require some live motion over session (not frozen)
    const liveEnough =
      motionEnergyRef.current > 0.002 ||
      yawRange > 0.05 ||
      pitchRange > 0.05 ||
      earMax - earMin > 0.02;

    if (passed && liveEnough && facePresentFramesRef.current > 8) {
      if (!passedStepsRef.current[stepRef.current]) {
        passedStepsRef.current[stepRef.current] = true;
        setFeedback(ch.feedbackOk);
        livenessLog("debug", "challenge_pass", { id: ch.id });
        window.setTimeout(() => {
          if (!runningRef.current) return;
          if (stepRef.current >= SESSION_LEN - 1) {
            // Final anti-spoof: total motion not zero
            if (motionEnergyRef.current < 0.0008 && yawRange < 0.08) {
              failSession("We could not confirm a live person.");
              return;
            }
            succeed();
            return;
          }
          stepRef.current += 1;
          setStep(stepRef.current);
          stepStartedRef.current = performance.now();
          earHistRef.current = [];
          yawHistRef.current = [];
          pitchHistRef.current = [];
          tiltHistRef.current = [];
          const next = challengesRef.current[stepRef.current];
          setFeedback(
            next ? `Good! Now ${next.label.toLowerCase()}` : "Hold on…",
          );
        }, 420);
      }
    } else {
      const age = now - stepStartedRef.current;
      if (age > STEP_MS + 1800) {
        // Timeout on this challenge soft nudge, don't fail whole session yet
        setFeedback(`${ch.label} keep your face in the circle`);
        stepStartedRef.current = now;
        earHistRef.current = [];
        yawHistRef.current = [];
        pitchHistRef.current = [];
        tiltHistRef.current = [];
      } else if (facePresentFramesRef.current > 5) {
        setFeedback(ch.label);
      }
    }

    // Session hard timeout ~10s
    if (sessionAge > 12000) {
      failSession("Timed out. Try again in better light.");
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  return tick;
}
