import { CHALLENGE_POOL } from "./constants";
import type { Challenge } from "./types";

export function pickChallenges(n: number): Challenge[] {
  const pool = [...CHALLENGE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, n);
}

export function blendScore(
  shapes: { categoryName: string; score: number }[] | undefined,
  name: string,
): number {
  if (!shapes) return 0;
  const hit = shapes.find((c) => c.categoryName === name);
  return hit?.score ?? 0;
}

/** Eye aspect ratio from MediaPipe face mesh indices */
export function eyeAspectRatio(lm: { x: number; y: number }[]): number {
  // Left eye: 33,160,158,133,153,144 roughly simplified vertical/horizontal
  const dist = (a: number, b: number) => {
    const p = lm[a];
    const q = lm[b];
    if (!p || !q) return 0;
    return Math.hypot(p.x - q.x, p.y - q.y);
  };
  const left =
    (dist(159, 145) + dist(158, 153)) / (2 * Math.max(dist(33, 133), 1e-6));
  const right =
    (dist(386, 374) + dist(385, 380)) / (2 * Math.max(dist(362, 263), 1e-6));
  return (left + right) / 2;
}

/**
 * Head yaw (turn left/right) and pitch (nod up/down) in radians from the
 * 4x4 facial transform, read as column-major (R = Rz·Ry·Rx):
 *   yaw   = atan2(-r20, hypot(r21, r22))
 *   pitch = atan2(r21, r22)
 * atan2(r10, r00) would be roll (tilting toward a shoulder), which is not
 * used. The challenges only compare magnitudes and ranges, so a row-major
 * layout (which only flips the signs) or a flipped forward axis (r22 < 0,
 * handled with |r22|) gives the same result.
 */
export function headPose(matrix?: { data: Float32Array | number[] }): {
  yaw: number;
  pitch: number;
} {
  if (!matrix?.data || matrix.data.length < 16) return { yaw: 0, pitch: 0 };
  const m = matrix.data;
  const r20 = Number(m[2]);
  const r21 = Number(m[6]);
  const r22 = Number(m[10]);
  const yaw = Math.atan2(-r20, Math.hypot(r21, r22));
  const pitch = Math.atan2(r21, Math.abs(r22));
  return { yaw, pitch };
}

/**
 * Which way the head is turned, from face landmarks in the raw camera frame
 * (the on-screen preview is mirrored, the frames given to MediaPipe are not).
 * Returns the nose tip's horizontal offset from the middle of the two face
 * edges, as a fraction of face width: > 0 means the person turned to their
 * own LEFT (their left side is on the image's right), < 0 their RIGHT.
 * Uses landmarks, not the transform matrix, so it does not depend on the
 * matrix layout or sign convention.
 */
export function headTurnSide(lm: { x: number }[]): number {
  const nose = lm[1];
  const a = lm[234];
  const b = lm[454];
  if (!nose || !a || !b) return 0;
  const width = Math.abs(a.x - b.x);
  if (width < 1e-6) return 0;
  return (nose.x - (a.x + b.x) / 2) / width;
}

/** Nose offset needed (fraction of face width) to count a turn's direction. */
export const TURN_SIDE_MIN = 0.06;

/**
 * Vertical head tilt from landmarks: where the nose tip sits between the
 * forehead top (10) and the chin (152), as a fraction of that span. The nose
 * sticks out from the face, so tilting the head up moves it toward the
 * forehead (the value drops) and tilting down moves it toward the chin (it
 * rises). Compare it with the person's own recent position, never with a
 * fixed level: a phone held low already tilts the head down. Null when the
 * landmarks are missing.
 */
export function headTiltRatio(lm: { y: number }[]): number | null {
  const nose = lm[1];
  const top = lm[10];
  const chin = lm[152];
  if (!nose || !top || !chin) return null;
  const span = chin.y - top.y;
  if (span < 1e-6) return null;
  return (nose.y - top.y) / span;
}

/** Tilt change (fraction of face height) that counts as looking up or down: about 6°. */
export const TILT_MIN = 0.02;

/** Lowest and highest sample values (0, 0 when empty). */
export function timedExtent(hist: TimedSample[]): { min: number; max: number } {
  if (hist.length === 0) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const s of hist) {
    if (s.v < min) min = s.v;
    if (s.v > max) max = s.v;
  }
  return { min, max };
}

/** A pose sample with its frame time (ms). */
export type TimedSample = { t: number; v: number };

/** How far back head-movement samples are kept: a natural nod or turn fits. */
export const POSE_WINDOW_MS = 1500;

/** Append a sample and drop those older than the window. Mutates `hist`. */
export function pushTimed(
  hist: TimedSample[],
  t: number,
  v: number,
  windowMs: number = POSE_WINDOW_MS,
): void {
  hist.push({ t, v });
  while (hist.length > 0 && t - hist[0]!.t > windowMs) hist.shift();
}

/** Max minus min of the samples (0 when empty). */
export function timedRange(hist: TimedSample[]): number {
  if (hist.length === 0) return 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of hist) {
    if (s.v < lo) lo = s.v;
    if (s.v > hi) hi = s.v;
  }
  return hi - lo;
}

export function dist3(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}
