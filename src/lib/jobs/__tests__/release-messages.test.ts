import { describe, expect, it } from "vitest";
import { friendlyReleaseError } from "../release-messages";

describe("friendlyReleaseError", () => {
  it("turns the developer bank message into plain words that blame nobody and name the next step", () => {
    const raw = "Repair Pro bank incomplete (bank code + 10-digit account + name). Funds stay in escrow.";
    const r = friendlyReleaseError(raw, "Eva")!;
    expect(r.kind).toBe("pro_bank");
    expect(r.blocksRelease).toBe(true);
    expect(r.message).toContain("safe in escrow");
    expect(r.message).toContain("Eva");
    expect(r.message).not.toMatch(/10-digit|bank code|Funds stay/i);
  });

  it("never exposes payout-provider or IP-whitelist jargon to a customer", () => {
    for (const raw of [
      "Flutterwave: IP Whitelisting is on for this account",
      "Transfer failed: insufficient balance",
      "This job is below Flutterwave’s bank-transfer minimum. Use a service charge of at least ₦120",
    ]) {
      const r = friendlyReleaseError(raw)!;
      expect(r.kind).toBe("transfer");
      expect(r.blocksRelease).toBe(false);
      expect(r.message).not.toMatch(/flutterwave|whitelist|minimum|insufficient/i);
      expect(r.message).toContain("safe in escrow");
    }
  });

  it("passes other messages through untouched, such as a sign-in problem", () => {
    const raw = "Sign in as the customer who booked this job to release payment.";
    expect(friendlyReleaseError(raw)).toEqual({ kind: "other", blocksRelease: false, message: raw });
  });

  it("returns null when there is no error", () => {
    expect(friendlyReleaseError(null)).toBeNull();
    expect(friendlyReleaseError("   ")).toBeNull();
  });
});
