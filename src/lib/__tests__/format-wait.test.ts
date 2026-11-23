import { describe, expect, it } from "vitest";
import { formatWait } from "../format-wait";

describe("formatWait", () => {
  it("shows seconds only under a minute", () => {
    expect(formatWait(1)).toBe("1 second");
    expect(formatWait(45)).toBe("45 seconds");
  });

  it("rounds up to whole minutes", () => {
    expect(formatWait(60)).toBe("about 1 minute");
    expect(formatWait(61)).toBe("about 2 minutes");
    expect(formatWait(1502)).toBe("about 26 minutes");
  });

  it("uses hours for long waits", () => {
    expect(formatWait(3600)).toBe("about 1 hour");
    expect(formatWait(5400)).toBe("about 1 hour 30 minutes");
    expect(formatWait(7260)).toBe("about 2 hours 1 minute");
  });

  it("never shows zero or nonsense", () => {
    expect(formatWait(0)).toBe("1 second");
    expect(formatWait(Number.NaN)).toBe("1 second");
  });
});
