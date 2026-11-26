import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: async () => ({ ok: true, userId: "u1" }),
}));
vi.mock("@/lib/server/payments/escrow-store", () => ({ listEscrowForUser: mocks.list }));
vi.mock("@/lib/server/structured-logger", () => ({ serverLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { GET } from "../history/route";

const row = (over: Record<string, unknown> = {}) => ({
  id: "p1", requestId: "j1", motoristId: "u1", repairProId: "u1", amountMinor: 2127000, currency: "NGN", status: "paid",
  escrowStatus: "pending_settlement", provider: "flutterwave", paidAt: "2026-11-22",
  createdAt: "2026-11-22", updatedAt: "2026-11-22", meta: {}, ...over,
});
async function labelFor(role: "motorist" | "professional", over: Record<string, unknown>) {
  mocks.list.mockResolvedValue([row(over)]);
  const res = await GET(new Request(`https://ona.test/api/payments/history?userId=u1&role=${role}`));
  const body = await res.json();
  const first = (body.data.payments ?? body.data.items ?? body.data.history ?? [])[0];
  return { label: first?.statusLabel ?? first?.status_label ?? first?.label, tone: first?.statusTone ?? first?.tone };
}

beforeEach(() => vi.clearAllMocks());

describe("payment history status labels", () => {
  it("the customer never sees the payout queue: a pending payout reads as Released", async () => {
    expect((await labelFor("motorist", { escrowStatus: "pending_settlement" })).label).toBe("Released");
    expect((await labelFor("motorist", { escrowStatus: "release_pending" })).label).toBe("Released");
  });

  it("the Service Pro still sees the payout is processing", async () => {
    expect((await labelFor("professional", { escrowStatus: "pending_settlement" })).label).toBe("Payout processing");
  });

  it("a suspended payout reads as on hold for the Pro and Released for the customer", async () => {
    const suspended = { escrowStatus: "held", meta: { payoutSuspended: true, payoutStatus: "suspended_admin" } };
    expect(await labelFor("professional", suspended)).toMatchObject({ label: "Payout on hold", tone: "bad" });
    expect((await labelFor("motorist", suspended)).label).toBe("Released");
  });

  it("a hard-failed transfer is also on hold for the Pro", async () => {
    expect((await labelFor("professional", { escrowStatus: "held", meta: { payoutStatus: "failed" } })).label).toBe("Payout on hold");
  });

  it("an ordinary held payment (job still open) is unchanged", async () => {
    expect((await labelFor("professional", { escrowStatus: "held" })).label).toBe("Held (job open)");
    expect((await labelFor("motorist", { escrowStatus: "held" })).label).toBe("Held");
  });

  it("a paid-out payment is Paid out / Released", async () => {
    expect((await labelFor("professional", { escrowStatus: "released" })).label).toBe("Paid out");
    expect((await labelFor("motorist", { escrowStatus: "released" })).label).toBe("Released");
  });
});

describe("payment history totals", () => {
  const summaryFor = async (role: "motorist" | "professional", rows: Record<string, unknown>[]) => {
    mocks.list.mockResolvedValue(rows.map((r) => row(r)));
    const res = await GET(new Request(`https://ona.test/api/payments/history?userId=u1&role=${role}`));
    return (await res.json()).data.summary;
  };

  it("a customer's queued payout counts as released, not also as held", async () => {
    const s = await summaryFor("motorist", [{ escrowStatus: "pending_settlement" }]);
    expect(s.heldCount).toBe(0);
    expect(s.heldMinor).toBe(0);
    expect(s.releasedCount).toBe(1);
    expect(s.releasedMinor).toBe(2127000);
  });

  it("a Service Pro's queued or on-hold payout is still money owed (held)", async () => {
    const s = await summaryFor("professional", [
      { id: "a", escrowStatus: "pending_settlement", proPayoutMinor: 1877000 },
      { id: "b", escrowStatus: "held", proPayoutMinor: 500000, meta: { payoutSuspended: true } },
    ]);
    expect(s.heldCount).toBe(2);
    expect(s.heldMinor).toBe(2377000);
    expect(s.releasedCount).toBe(0);
  });

  it("an ordinary held payment is held for both sides", async () => {
    expect((await summaryFor("motorist", [{ escrowStatus: "held" }])).heldCount).toBe(1);
    expect((await summaryFor("professional", [{ escrowStatus: "held", proPayoutMinor: 100 }])).heldCount).toBe(1);
  });
});
