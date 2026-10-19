import { describe, expect, it } from "vitest";
import {
  composeLoginPhone,
  formatCountdown,
  maskPhone,
  splitPastedPhone,
} from "./phone-input";

describe("composeLoginPhone", () => {
  it("composes dial + national and drops the leading 0", () => {
    expect(composeLoginPhone("234", "0801 234 5678")).toBe("+2348012345678");
    expect(composeLoginPhone("234", "8012345678")).toBe("+2348012345678");
  });
  it("returns empty with no digits", () => {
    expect(composeLoginPhone("234", "  ")).toBe("");
  });
  it("keeps a pasted full number", () => {
    expect(composeLoginPhone("234", "+234 801 234 5678")).toBe(
      "+2348012345678",
    );
    expect(composeLoginPhone("234", "002348012345678")).toBe("+2348012345678");
    expect(composeLoginPhone("234", "2348012345678")).toBe("+2348012345678");
    expect(composeLoginPhone("234", "+447911123456")).toBe("+447911123456");
  });
});

describe("splitPastedPhone / maskPhone / formatCountdown", () => {
  it("splits only +numbers", () => {
    expect(splitPastedPhone("0801")).toBeNull();
    expect(splitPastedPhone("+447911123456")?.iso).toBe("GB");
  });
  it("masks the middle digits", () => {
    expect(maskPhone("+2348014564567")).toBe("+234 801 ••• 4567");
    expect(maskPhone("")).toBe("");
  });
  it("formats mm:ss", () => {
    expect(formatCountdown(45)).toBe("00:45");
    expect(formatCountdown(75)).toBe("01:15");
  });
});
