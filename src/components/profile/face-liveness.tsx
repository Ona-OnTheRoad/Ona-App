"use client";

/**
 * Ona Tier 3 Video Liveness Detection
 * MediaPipe Face Landmarker (live stream only no video file stored).
 * Random challenges · anti-spoof heuristics · 6-fail lockout · copper success.
 *
 * Future: POST summary to /api/liveness/verify for server re-check (hook ready).
 */

import { FaceLivenessView } from "./face-liveness/face-liveness-view";
import { useFaceLiveness } from "./face-liveness/use-face-liveness";

export function FaceLiveness({
  isLight,
  onPassed,
  onCancel,
  userKey = "guest",
  userId,
}: {
  isLight: boolean;
  onPassed: () => void;
  onCancel: () => void;
  /** For lockout storage email / backend id */
  userKey?: string;
  /** When set, reports pass to backend `/api/liveness/verify` */
  userId?: string;
}) {
  const live = useFaceLiveness({ onPassed, onCancel, userKey, userId });

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
