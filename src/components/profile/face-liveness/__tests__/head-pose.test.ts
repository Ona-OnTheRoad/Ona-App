import { describe, expect, it } from "vitest";
import {
  headPose,
  headTiltRatio,
  headTurnSide,
  pushTimed,
  timedRange,
  TILT_MIN,
  timedExtent,
  TURN_SIDE_MIN,
  type TimedSample,
} from "../helpers";

type M3 = number[][];

const mul = (a: M3, b: M3): M3 =>
  a.map((row, i) =>
    b[0]!.map((_, j) => row.reduce((s, _v, k) => s + a[i]![k]! * b[k]![j]!, 0)),
  );
const rotX = (p: number): M3 => [
  [1, 0, 0],
  [0, Math.cos(p), -Math.sin(p)],
  [0, Math.sin(p), Math.cos(p)],
];
const rotY = (y: number): M3 => [
  [Math.cos(y), 0, Math.sin(y)],
  [0, 1, 0],
  [-Math.sin(y), 0, Math.cos(y)],
];
const rotZ = (r: number): M3 => [
  [Math.cos(r), -Math.sin(r), 0],
  [Math.sin(r), Math.cos(r), 0],
  [0, 0, 1],
];

/** 4x4 transform with R = Rz·Ry·Rx, flattened column-major like MediaPipe. */
function transform(
  { yaw = 0, pitch = 0, roll = 0 },
  layout: "col" | "row" = "col",
) {
  const r = mul(rotZ(roll), mul(rotY(yaw), rotX(pitch)));
  const m4 = [
    [...r[0]!, 0.5],
    [...r[1]!, -1],
    [...r[2]!, -40],
    [0, 0, 0, 1],
  ];
  const data: number[] = [];
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
      data.push(layout === "col" ? m4[b]![a]! : m4[a]![b]!);
  return { data };
}

const deg = (d: number) => (d * Math.PI) / 180;

describe("headPose", () => {
  it("reads a left/right turn as yaw, not pitch", () => {
    const p = headPose(transform({ yaw: deg(20) }));
    expect(p.yaw).toBeCloseTo(deg(20), 5);
    expect(p.pitch).toBeCloseTo(0, 5);
  });

  it("reads a nod as pitch, not yaw", () => {
    const p = headPose(transform({ pitch: deg(-15) }));
    expect(p.pitch).toBeCloseTo(deg(-15), 5);
    expect(p.yaw).toBeCloseTo(0, 5);
  });

  it("ignores roll (tilting toward a shoulder)", () => {
    const p = headPose(transform({ roll: deg(25) }));
    expect(Math.abs(p.yaw)).toBeLessThan(1e-6);
    expect(Math.abs(p.pitch)).toBeLessThan(1e-6);
  });

  it("separates combined yaw and pitch", () => {
    const p = headPose(transform({ yaw: deg(12), pitch: deg(10), roll: deg(5) }));
    expect(p.yaw).toBeCloseTo(deg(12), 5);
    expect(p.pitch).toBeCloseTo(deg(10), 5);
  });

  it("gives the same magnitudes for a row-major layout", () => {
    const p = headPose(transform({ yaw: deg(18) }, "row"));
    expect(Math.abs(p.yaw)).toBeCloseTo(deg(18), 5);
    const q = headPose(transform({ pitch: deg(14) }, "row"));
    expect(Math.abs(q.pitch)).toBeCloseTo(deg(14), 5);
    expect(Math.abs(q.yaw)).toBeLessThan(1e-6);
  });

  it("stays continuous when the forward axis is flipped", () => {
    const flipped = transform({ pitch: deg(10) });
    // Negate the third column (forward axis): r02, r12, r22.
    for (const i of [8, 9, 10]) flipped.data[i] = -flipped.data[i]!;
    const p = headPose(flipped);
    expect(Math.abs(p.pitch)).toBeCloseTo(deg(10), 5);
  });

  it("returns zeros without a matrix", () => {
    expect(headPose(undefined)).toEqual({ yaw: 0, pitch: 0 });
  });
});

describe("timed pose window", () => {
  it("keeps a slow nod inside the window", () => {
    const hist: TimedSample[] = [];
    // A 1.2 s nod sampled at 15 fps (a slow phone): 0 -> -0.15 -> +0.1 rad.
    for (let i = 0; i <= 18; i++) {
      const t = i * 66;
      const v = i <= 9 ? -0.15 * (i / 9) : -0.15 + 0.25 * ((i - 9) / 9);
      pushTimed(hist, t, v);
    }
    expect(timedRange(hist)).toBeCloseTo(0.25, 5);
  });

  it("drops samples older than the window", () => {
    const hist: TimedSample[] = [];
    pushTimed(hist, 0, 1);
    pushTimed(hist, 1000, 0.2);
    pushTimed(hist, 2000, 0.1);
    expect(hist.map((s) => s.v)).toEqual([0.2, 0.1]);
    expect(timedRange(hist)).toBeCloseTo(0.1, 5);
    expect(timedRange([])).toBe(0);
  });
});

describe("headTurnSide", () => {
  /** Raw (unmirrored) camera frame: the person's right cheek (234) is on the image's left. */
  function face(noseX: number) {
    const lm: { x: number }[] = Array.from({ length: 468 }, () => ({ x: 0.5 }));
    lm[234] = { x: 0.35 };
    lm[454] = { x: 0.65 };
    lm[1] = { x: noseX };
    return lm;
  }

  it("is positive when the person turns to their own left", () => {
    // Turning left moves the nose toward the image's right in the raw frame.
    expect(headTurnSide(face(0.56))).toBeGreaterThan(TURN_SIDE_MIN);
  });

  it("is negative when the person turns to their own right", () => {
    expect(headTurnSide(face(0.44))).toBeLessThan(-TURN_SIDE_MIN);
  });

  it("is near zero facing the camera and does not depend on edge order", () => {
    expect(Math.abs(headTurnSide(face(0.5)))).toBeLessThan(1e-9);
    const swapped = face(0.56);
    [swapped[234], swapped[454]] = [swapped[454]!, swapped[234]!];
    expect(headTurnSide(swapped)).toBeGreaterThan(TURN_SIDE_MIN);
  });

  it("returns 0 when landmarks are missing", () => {
    expect(headTurnSide([])).toBe(0);
  });
});

describe("headTiltRatio", () => {
  /** Forehead top at y 0.3, chin at y 0.7 (image y grows downward). */
  function face(noseY: number) {
    const lm: { y: number }[] = Array.from({ length: 468 }, () => ({ y: 0.5 }));
    lm[10] = { y: 0.3 };
    lm[152] = { y: 0.7 };
    lm[1] = { y: noseY };
    return lm;
  }

  it("drops when the head tilts up and rises when it tilts down", () => {
    const neutral = headTiltRatio(face(0.52))!;
    const up = headTiltRatio(face(0.5))!;
    const down = headTiltRatio(face(0.54))!;
    expect(neutral - up).toBeGreaterThan(TILT_MIN);
    expect(down - neutral).toBeGreaterThan(TILT_MIN);
  });

  it("counts a small tilt up from a head already tilted down (phone held low)", () => {
    const hist: TimedSample[] = [];
    // Starts tilted down (0.6) and tilts up to 0.58: never above the camera's level.
    [0.6, 0.6, 0.595, 0.59, 0.58].forEach((v, i) => pushTimed(hist, i * 100, v));
    const { max } = timedExtent(hist);
    expect(max - 0.58).toBeGreaterThan(TILT_MIN - 1e-9);
  });

  it("returns null without landmarks", () => {
    expect(headTiltRatio([])).toBeNull();
    expect(timedExtent([])).toEqual({ min: 0, max: 0 });
  });
});
