import { describe, expect, it } from "vitest";
import {
  CAMERA_IDEAL_HEIGHT,
  CAMERA_IDEAL_WIDTH,
  CAMERA_VIDEO_CONSTRAINTS,
  SELFIE_JPEG_QUALITY,
  SELFIE_MAX_WIDTH,
} from "../constants";

describe("Tier 3 selfie capture quality", () => {
  it("targets Prembly-friendly frame size and JPEG quality", () => {
    expect(SELFIE_MAX_WIDTH).toBeGreaterThanOrEqual(1280);
    expect(SELFIE_JPEG_QUALITY).toBeGreaterThanOrEqual(0.9);
    expect(CAMERA_IDEAL_WIDTH).toBeGreaterThanOrEqual(1280);
    expect(CAMERA_IDEAL_HEIGHT).toBeGreaterThanOrEqual(720);
    expect(CAMERA_VIDEO_CONSTRAINTS).toMatchObject({
      facingMode: "user",
      width: { ideal: CAMERA_IDEAL_WIDTH },
      height: { ideal: CAMERA_IDEAL_HEIGHT },
    });
  });
});
