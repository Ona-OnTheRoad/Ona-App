import { describe, expect, it } from "vitest";
import { isJobPayable } from "../job-status";

describe("isJobPayable", () => {
  it("offers payment for an agreed job", () => {
    expect(isJobPayable({ status: "agreed", agreedMajor: 5000 })).toBe(true);
  });
  it("offers payment again when the customer simply ran out of time (expired)", () => {
    expect(isJobPayable({ status: "expired", agreedMajor: 5000 })).toBe(true);
    expect(isJobPayable({ status: "expired", agreedMajor: null })).toBe(false);
  });
  it("NEVER offers payment for a cancelled job, whoever cancelled it", () => {
    expect(isJobPayable({ status: "cancelled", agreedMajor: 5000 })).toBe(false);
  });
});
