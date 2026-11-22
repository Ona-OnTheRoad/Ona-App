import { describe, expect, it } from "vitest";
import { resolveLocationGate } from "@/lib/location-gate";

const base = {
  permission: "granted" as const,
  hasLiveFix: false,
  hasCachedFix: false,
  waitExpired: false,
  skipped: false,
};

describe("resolveLocationGate", () => {
  it("waits for the first fix when allowed and nothing is cached", () => {
    expect(resolveLocationGate(base)).toBe("resolving");
  });
  it("shows the explainer while permission is unanswered", () => {
    expect(resolveLocationGate({ ...base, permission: "prompt" })).toBe("prompt");
  });
  it("stays on the explainer past the wait cap (the user can still skip)", () => {
    expect(
      resolveLocationGate({ ...base, permission: "prompt", waitExpired: true }),
    ).toBe("prompt");
  });
  it("renders immediately on denied (default area, no wait)", () => {
    expect(resolveLocationGate({ ...base, permission: "denied" })).toBe("denied");
  });
  it("never hangs: the wait cap releases the map", () => {
    expect(resolveLocationGate({ ...base, waitExpired: true })).toBe("ready");
    expect(
      resolveLocationGate({ ...base, permission: null, waitExpired: true }),
    ).toBe("ready");
  });
  it("opens at once on a real fix, a cached fix, or Skip", () => {
    expect(resolveLocationGate({ ...base, hasLiveFix: true })).toBe("ready");
    expect(resolveLocationGate({ ...base, hasCachedFix: true })).toBe("ready");
    expect(
      resolveLocationGate({ ...base, permission: "prompt", skipped: true }),
    ).toBe("ready");
  });
  it("treats unsupported permissions API like granted (bounded wait)", () => {
    expect(resolveLocationGate({ ...base, permission: "unknown" })).toBe("resolving");
  });
});
