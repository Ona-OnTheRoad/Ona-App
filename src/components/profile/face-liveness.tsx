"use client";

/**
 * Ona Tier 3 Video Liveness Detection
 * MediaPipe Face Landmarker (live stream only no video file stored).
 * Random challenges · anti-spoof heuristics · 6-fail lockout · copper success.
 *
 * With `serverVerify` (Tier 3) the challenge is only a UX gate: one frame is
 * sent to /api/liveness/verify and success waits for the server's verdict.
 */

import { FaceLivenessView } from "./face-liveness/face-liveness-view";
import { useFaceLiveness } from "./face-liveness/use-face-liveness";

export function FaceLiveness({
  isLight,
  onPassed,
  onCancel,
  userKey = "guest",
  userId,
  serverVerify = false,
}: {
  isLight: boolean;
  onPassed: () => void;
  onCancel: () => void;
  /** For lockout storage email / backend id */
  userKey?: string;
  /** Backend user id; required when `serverVerify` is set */
  userId?: string;
  /** Tier 3: require a server provider pass before `onPassed` */
  serverVerify?: boolean;
}) {
  const live = useFaceLiveness({
    onPassed,
    onCancel,
    userKey,
    userId,
    serverVerify,
  });

  return (
    <FaceLivenessView
      isLight={isLight}
      videoRef={live.videoRef}
      phase={live.phase}
      step={live.step}
      feedback={live.feedback}
      progress={live.progress}
      ready={live.ready}
      modelReady={live.modelReady}
      err={live.err}
      lockMinutes={live.lockMinutes}
      onRetry={live.onRetry}
      onClose={live.cancelAndClose}
    />
  );
}
