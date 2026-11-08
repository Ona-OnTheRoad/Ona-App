import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/lib/types";
import { isProJobsEligible } from "./pro-jobs-gate";

const p = (x: Partial<UserProfile>) => x as UserProfile;

describe("isProJobsEligible", () => {
  it("is off for customers, guests and unverified pros", () => {
    expect(isProJobsEligible("motorist", p({ proJobsEligible: true }))).toBe(false);
    expect(isProJobsEligible("professional", null)).toBe(false);
    expect(isProJobsEligible("professional", p({}))).toBe(false);
    expect(isProJobsEligible("professional", p({ identityReviewStatus: "submitted" }))).toBe(false);
  });
  it("trusts the server flag in both directions", () => {
    expect(isProJobsEligible("professional", p({ proJobsEligible: true }))).toBe(true);
    expect(
      isProJobsEligible("professional", p({ proJobsEligible: false, ninVerified: true }), {
        govIdReviewStatus: "approved",
      }),
    ).toBe(false);
  });
  it("falls back to local Tier 2 signals for older cached profiles", () => {
    expect(isProJobsEligible("professional", p({ ninVerified: true }))).toBe(true);
    expect(isProJobsEligible("professional", p({}), { govIdReviewStatus: "approved" })).toBe(true);
  });
  it("never enables a suspended or rejected pro on the fallback path", () => {
    expect(
      isProJobsEligible("professional", p({ ninVerified: true }), { status: "suspended" }),
    ).toBe(false);
  });
});
