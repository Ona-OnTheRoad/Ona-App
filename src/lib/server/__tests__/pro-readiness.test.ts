import { describe, expect, it } from "vitest";
import { isProJobsEligible, isProMarketplaceReady } from "../pro-readiness";

describe("isProMarketplaceReady", () => {
  it.each([
    [{ visibility_tier: 2 }],
    [{ visibility_tier: "3" }],
    [{ gov_id_review_status: "approved" }],
    [{ verified: true }],
    [{ status: "approved" }],
  ])("lists %j", (row) => expect(isProMarketplaceReady(row)).toBe(true));

  it("does not list a brand-new pro", () => {
    expect(isProMarketplaceReady({ visibility_tier: 1, status: "pending" })).toBe(false);
    expect(isProMarketplaceReady({})).toBe(false);
  });
});

describe("isProJobsEligible", () => {
  it("covers every pro the customer feed can show", () => {
    for (const row of [
      { status: "approved" },
      { visibility_tier: 2 },
      { gov_id_review_status: "approved" },
      { verified: true },
    ]) {
      expect(isProMarketplaceReady(row)).toBe(true);
      expect(isProJobsEligible(row)).toBe(true);
    }
  });
  it("covers a pro the dispatcher can reach just by being online", () => {
    expect(isProJobsEligible({ is_online: true, status: "pending" })).toBe(true);
  });
  it("excludes suspended and rejected pros even when online", () => {
    expect(isProJobsEligible({ status: "suspended", is_online: true, verified: true })).toBe(false);
    expect(isProJobsEligible({ status: "rejected", is_online: true })).toBe(false);
  });
  it("is off for a pro who has not been approved and is not online", () => {
    expect(isProJobsEligible({ status: "pending", visibility_tier: 1 })).toBe(false);
    expect(isProJobsEligible(null)).toBe(false);
  });
});
