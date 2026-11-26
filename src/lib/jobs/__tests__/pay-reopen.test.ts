import { describe, expect, it } from "vitest";
import { PAY_HISTORY } from "../constants";
import { cancelledByLabel, canReopenForPayment } from "../pay-reopen";

const at = "2026-06-01T10:00:00.000Z";
const job = (status: string, history: Array<{ status: string; by: string }>, escrowStatus: string | null = null) =>
  ({ status, escrowStatus, statusHistory: history.map((h) => ({ ...h, at })) }) as never;

describe("canReopenForPayment: only an unpaid timeout can be paid again, never a cancel", () => {
  it("allows a job that expired because the customer did not pay in time", () => {
    expect(canReopenForPayment(job("expired", [{ status: "expired", by: PAY_HISTORY.UNPAID_BOOK_EXPIRE }]))).toBe(true);
  });

  it("REFUSES a job the Service Pro cancelled", () => {
    expect(canReopenForPayment(job("cancelled", [{ status: "agreed", by: "system" }, { status: "cancelled", by: "repair_pro" }]))).toBe(false);
  });

  it("refuses a job the customer cancelled, and a system/other cancel", () => {
    expect(canReopenForPayment(job("cancelled", [{ status: "cancelled", by: "motorist" }]))).toBe(false);
    expect(canReopenForPayment(job("cancelled", [{ status: "cancelled", by: "system" }]))).toBe(false);
  });

  it("refuses after the maximum payment attempts", () => {
    expect(canReopenForPayment(job("cancelled", [{ status: "cancelled", by: PAY_HISTORY.MAX_ATTEMPTS_CANCEL }]))).toBe(false);
    expect(canReopenForPayment(job("expired", [{ status: "cancelled", by: PAY_HISTORY.MAX_ATTEMPTS_CANCEL }, { status: "expired", by: PAY_HISTORY.UNPAID_BOOK_EXPIRE }]))).toBe(false);
  });

  it("refuses when money is already held or released", () => {
    for (const e of ["held", "released", "release_pending"]) {
      expect(canReopenForPayment(job("expired", [{ status: "expired", by: PAY_HISTORY.UNPAID_BOOK_EXPIRE }], e))).toBe(false);
    }
  });

  it("refuses an expiry that was not the unpaid-booking timeout (e.g. no one answered)", () => {
    expect(canReopenForPayment(job("expired", [{ status: "expired", by: "system" }]))).toBe(false);
    expect(canReopenForPayment(job("expired", []))).toBe(false);
  });

  it("never reopens a job that is not expired", () => {
    for (const s of ["agreed", "negotiating", "paid_booked", "completed"]) {
      expect(canReopenForPayment(job(s, [{ status: "expired", by: PAY_HISTORY.UNPAID_BOOK_EXPIRE }]))).toBe(false);
    }
  });
});

describe("cancelledByLabel", () => {
  it("names who cancelled", () => {
    expect(cancelledByLabel(job("cancelled", [{ status: "cancelled", by: "repair_pro" }]))).toBe("pro");
    expect(cancelledByLabel(job("cancelled", [{ status: "cancelled", by: "motorist" }]))).toBe("customer");
    expect(cancelledByLabel(job("cancelled", [{ status: "cancelled", by: "system" }]))).toBe("other");
    expect(cancelledByLabel(job("cancelled", []))).toBe("other");
  });
});
