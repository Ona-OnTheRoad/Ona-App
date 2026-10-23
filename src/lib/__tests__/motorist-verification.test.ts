import { describe, expect, it } from "vitest";
import { isMotoristVerified } from "@/lib/verification-gate";
import type { UserProfile } from "@/lib/types";

describe("isMotoristVerified", () => {
  it("returns false for null or undefined profile", () => {
    expect(isMotoristVerified(null)).toBe(false);
    expect(isMotoristVerified(undefined)).toBe(false);
  });

  it("returns false for a newly registered motorist with no verification", () => {
    const unverifiedProfile = {
      fullName: "New Motorist",
      email: "new@example.com",
      phone: "+2348012345678",
      phoneVerified: false,
      govIdVerified: false,
    } as unknown as UserProfile;

    expect(isMotoristVerified(unverifiedProfile)).toBe(false);
  });

  it("returns true for a Tier 1 motorist with phone verified", () => {
    const tier1Profile = {
      fullName: "Tier 1 Motorist",
      phoneVerified: true,
    } as unknown as UserProfile;

    expect(isMotoristVerified(tier1Profile)).toBe(true);
  });

  it("returns true for a Tier 2 motorist with approved identity", () => {
    const tier2Profile = {
      fullName: "Tier 2 Motorist",
      phoneVerified: false,
      identityReviewStatus: "approved",
    } as unknown as UserProfile;

    expect(isMotoristVerified(tier2Profile)).toBe(true);
  });

  it("returns true for a Tier 3 in-person verified motorist", () => {
    const tier3Profile = {
      fullName: "Tier 3 Motorist",
      inPersonVerified: true,
    } as unknown as UserProfile;

    expect(isMotoristVerified(tier3Profile)).toBe(true);
  });
});
