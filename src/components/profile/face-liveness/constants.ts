import type { Challenge } from "./types";

export const CHALLENGE_POOL: Challenge[] = [
  { id: "blink", label: "Blink both eyes clearly", feedbackOk: "Good blink" },
  { id: "smile", label: "Smile naturally", feedbackOk: "Nice smile" },
  {
    id: "turn_left",
    label: "Slowly turn your head left",
    feedbackOk: "Left turn OK",
  },
  {
    id: "turn_right",
    label: "Slowly turn your head right",
    feedbackOk: "Right turn OK",
  },
  { id: "nod", label: "Nod your head once", feedbackOk: "Nod detected" },
  { id: "look_up", label: "Tilt your head up", feedbackOk: "Look up OK" },
  { id: "look_down", label: "Tilt your head down", feedbackOk: "Look down OK" },
];

/** Challenges per session short session, low data */
export const SESSION_LEN = 3;
export const STEP_MS = 2200;
export const SESSION_TARGET_MS = SESSION_LEN * STEP_MS; // ~6.6s in 5-8s band

/**
 * Prembly wants ~480px across the face region. Prefer a higher frame so the
 * face oval still clears that after JPEG encode.
 */
export const CAMERA_IDEAL_WIDTH = 1280;
export const CAMERA_IDEAL_HEIGHT = 720;
export const SELFIE_MAX_WIDTH = 1280;
export const SELFIE_JPEG_QUALITY = 0.92;

export const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: CAMERA_IDEAL_WIDTH },
  height: { ideal: CAMERA_IDEAL_HEIGHT },
  frameRate: { ideal: 24, max: 30 },
};

export const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
export const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
