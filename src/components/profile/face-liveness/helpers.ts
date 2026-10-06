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

/** Yaw / pitch from 4x4 row-major facial transform (approx) */
export function headPose(matrix?: { data: Float32Array | number[] }): {
  yaw: number;
  pitch: number;
} {
  if (!matrix?.data || matrix.data.length < 16) return { yaw: 0, pitch: 0 };
  const m = matrix.data;
  // Rotation elements (column-major in some MP builds try both heuristics)
  const r00 = Number(m[0]);
  const r10 = Number(m[1]);
  const r20 = Number(m[2]);
  const r21 = Number(m[6]);
  const r22 = Number(m[10]);
  const yaw = Math.atan2(r10, r00);
  const pitch = Math.atan2(-r20, Math.hypot(r21, r22));
  return { yaw, pitch };
}

export function dist3(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}
