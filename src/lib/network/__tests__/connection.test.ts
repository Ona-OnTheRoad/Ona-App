import { describe, expect, it } from "vitest";
import {
  DEFAULT_NETWORK_STATE,
  networkStateKey,
  qualityFrom,
  readNetworkState,
  shouldDeferHeavyContent,
} from "@/lib/network/connection";

describe("qualityFrom", () => {
  it("treats 2G, slow-2G and Data Saver as slow", () => {
    expect(qualityFrom({ effectiveType: "2g" })).toBe("slow");
    expect(qualityFrom({ effectiveType: "slow-2g" })).toBe("slow");
    expect(qualityFrom({ effectiveType: "4g", saveData: true })).toBe("slow");
  });
  it("treats 3G as fair and 4G or unknown as good", () => {
    expect(qualityFrom({ effectiveType: "3g" })).toBe("fair");
    expect(qualityFrom({ effectiveType: "4g" })).toBe("good");
    expect(qualityFrom(undefined)).toBe("good");
    expect(qualityFrom({})).toBe("good");
  });
});

describe("readNetworkState", () => {
  it("reads online state and connection hints", () => {
    expect(
      readNetworkState({
        onLine: true,
        connection: { effectiveType: "2g", saveData: true },
      }),
    ).toEqual({ online: true, quality: "slow", saveData: true });
  });
  it("reports offline only when onLine is exactly false", () => {
    expect(readNetworkState({ onLine: false }).online).toBe(false);
    expect(readNetworkState({}).online).toBe(true);
  });
  it("falls back to a safe default without a navigator (server render)", () => {
    expect(readNetworkState(undefined)).toEqual(DEFAULT_NETWORK_STATE);
  });
  it("gives equal keys for equal states", () => {
    expect(
      networkStateKey({ online: true, quality: "good", saveData: false }),
    ).toBe(networkStateKey(DEFAULT_NETWORK_STATE));
  });
});

describe("shouldDeferHeavyContent", () => {
  it("waits for a tap on 2G / Data Saver or offline, loads on 3G and better", () => {
    expect(shouldDeferHeavyContent({ online: true, quality: "slow" })).toBe(
      true,
    );
    expect(shouldDeferHeavyContent({ online: false, quality: "good" })).toBe(
      true,
    );
    expect(shouldDeferHeavyContent({ online: true, quality: "fair" })).toBe(
      false,
    );
    expect(shouldDeferHeavyContent({ online: true, quality: "good" })).toBe(
      false,
    );
  });
});
