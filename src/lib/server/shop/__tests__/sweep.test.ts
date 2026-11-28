import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "./fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => db.client }));
const pay = vi.hoisted(() => ({ verifyShopPayment: vi.fn() }));
vi.mock("@/lib/server/shop/payments", () => pay);
const orders = vi.hoisted(() => ({ cancelUnpaidOrder: vi.fn(async () => undefined) }));
vi.mock("@/lib/server/shop/orders", () => orders);

import { runShopSweep } from "@/lib/server/shop/sweep";

const NOW = Date.parse("2026-11-28T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

beforeEach(() => {
  vi.clearAllMocks();
  db = makeFakeDb({
    shop_payments: [
      { provider_ref: "shop_old", status: "pending", created_at: ago(30 * MIN) },
      { provider_ref: "shop_fresh", status: "pending", created_at: ago(1 * MIN) },
      { provider_ref: "shop_ancient", status: "pending", created_at: ago(100 * HOUR) },
      { provider_ref: "shop_done", status: "succeeded", created_at: ago(30 * MIN) },
    ],
    shop_orders: [
      { id: "o-stale", user_id: "u1", status: "pending_payment", created_at: ago(30 * HOUR) },
      { id: "o-new", user_id: "u2", status: "pending_payment", created_at: ago(2 * HOUR) },
      { id: "o-paid", user_id: "u3", status: "paid", created_at: ago(30 * HOUR) },
    ],
  });
});

describe("runShopSweep (B1 safety net, H3)", () => {
  it("re-checks only pending payments in the 3 min .. 72 h window", async () => {
    pay.verifyShopPayment.mockResolvedValue({ success: true, orderId: "o" });
    const r = await runShopSweep(NOW);
    expect(pay.verifyShopPayment).toHaveBeenCalledTimes(1);
    expect(pay.verifyShopPayment).toHaveBeenCalledWith({ reference: "shop_old" });
    expect(r).toMatchObject({ reconciled: 1, confirmed: 1 });
  });

  it("counts still-pending and keeps going when one verify throws", async () => {
    db.tables.shop_payments.push({ provider_ref: "shop_old2", status: "pending", created_at: ago(40 * MIN) });
    pay.verifyShopPayment
      .mockRejectedValueOnce(new Error("provider down"))
      .mockResolvedValueOnce({ success: false, pending: true });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const r = await runShopSweep(NOW);
    expect(r).toMatchObject({ reconciled: 2, errors: 1, stillPending: 1 });
    warn.mockRestore();
  });

  it("cancels only unpaid orders older than 24 h", async () => {
    pay.verifyShopPayment.mockResolvedValue({ success: false, pending: true });
    const r = await runShopSweep(NOW);
    expect(orders.cancelUnpaidOrder).toHaveBeenCalledTimes(1);
    expect(orders.cancelUnpaidOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "o-stale", userId: "u1", reason: "stale_unpaid" }),
    );
    expect(r.cancelled).toBe(1);
  });

  it("an order that got paid in the meantime is skipped without failing the sweep", async () => {
    pay.verifyShopPayment.mockResolvedValue({ success: false, pending: true });
    orders.cancelUnpaidOrder.mockRejectedValueOnce(new Error("Order can no longer be cancelled"));
    const r = await runShopSweep(NOW);
    expect(r.cancelled).toBe(0);
  });
});
