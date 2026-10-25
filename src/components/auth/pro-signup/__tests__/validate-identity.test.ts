import { describe, expect, it } from "vitest";
import { needsIdentityStep, validateIdentity } from "../validation";

describe("validateIdentity", () => {
  it("asks for gender and date of birth when missing", () => {
    expect(validateIdentity({ gender: "", dateOfBirth: "1990-05-01" })).toMatch(
      /gender/i,
    );
    expect(validateIdentity({ gender: "male", dateOfBirth: "" })).toMatch(
      /birth/i,
    );
    expect(needsIdentityStep({ gender: "", dateOfBirth: "" })).toBe(true);
  });

  it("passes when both are present", () => {
    const f = { gender: "female" as const, dateOfBirth: "1990-05-01" };
    expect(validateIdentity(f)).toBeNull();
    expect(needsIdentityStep(f)).toBe(false);
  });
});
