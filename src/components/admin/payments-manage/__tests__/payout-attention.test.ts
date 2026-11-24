import { describe, expect, it } from "vitest";
import { payoutAttention } from "../helpers";
import type { Ops, Payment } from "../types";

const ops = (available: number | null): Ops => ({
  flw: { available, ledger: 1267936.84, refreshedAt: "2026-11-22T10:00:00Z" },
  ona: { escrowHeldMinor: 0, pendingSettlementMinor: 0, pendingSettlementCount: 0, releasedCount: 0, failedCount: 0, disputedCount: 0, refundedCount: 0 },
});
const pay = (over: Partial<Payment> = {}): Payment => ({
  id: "p1", amount_kobo: 2127000, currency: "NGN", status: "paid",
  escrow_status: "pending_settlement", created_at: "2026-11-22T09:00:00Z", pro_payout_kobo: 1877000, ...over,
});

describe("payoutAttention", () => {
  it("flags the real case: Available ₦0 against a ₦18,770 pending payout", () => {
    const a = payoutAttention(ops(0), [pay()]);
    expect(a.floatShort).toEqual({ availableNgn: 0, owedMinor: 1877000, shortNgn: 18770, pendingCount: 1 });
    expect(a.suspended).toEqual({ count: 0, owedMinor: 0 });
  });

  it("adds up every pending payout and compares against Available", () => {
    const a = payoutAttention(ops(10000), [pay(), pay({ id: "p2" })]);
    expect(a.floatShort).toMatchObject({ owedMinor: 3754000, shortNgn: 27540, pendingCount: 2 });
  });

  it("stays quiet when Available covers what is owed, or when nothing is pending", () => {
    expect(payoutAttention(ops(18770), [pay()]).floatShort).toBeNull();
    expect(payoutAttention(ops(0), []).floatShort).toBeNull();
    expect(payoutAttention(ops(0), [pay({ escrow_status: "released", released_at: "2026-11-22" })]).floatShort).toBeNull();
  });

  it("does not guess when the balance is unknown", () => {
    expect(payoutAttention(null, [pay()]).floatShort).toBeNull();
    expect(payoutAttention(ops(null), [pay()]).floatShort).toBeNull();
  });

  it("falls back to 87.5% of the charge when the net payout is not stored", () => {
    const a = payoutAttention(ops(0), [pay({ pro_payout_kobo: null, amount_kobo: 2000000 })]);
    expect(a.floatShort?.owedMinor).toBe(1750000);
  });

  it("counts suspended payouts separately, and they are not double counted as pending", () => {
    const a = payoutAttention(ops(0), [
      pay({ id: "s1", escrow_status: "held", payout_suspended: true, payout_status: "suspended_admin" }),
      pay({ id: "s2", escrow_status: "held", payout_suspended: true }),
    ]);
    expect(a.suspended).toEqual({ count: 2, owedMinor: 3754000 });
    expect(a.floatShort).toBeNull();
  });
});
