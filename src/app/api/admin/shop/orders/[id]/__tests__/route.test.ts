import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "@/lib/server/shop/__tests__/fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => db.client }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));

const auth = vi.hoisted(() => {
  class AdminAuthError extends Error {
    constructor(message: string, public status: number, public code: string) {
      super(message);
    }
  }
  return { requireAdmin: vi.fn(), requirePermission: vi.fn(), AdminAuthError };
});
vi.mock("@/lib/server/admin-auth", () => auth);
const AdminAuthError = auth.AdminAuthError;

const orders = vi.hoisted(() => ({
  cancelUnpaidOrder: vi.fn(),
  refundShopOrder: vi.fn(),
  REFUNDABLE_ORDER_STATUSES: ["paid", "fulfilling", "out_for_delivery", "refund_pending"],
}));
vi.mock("@/lib/server/shop/orders", () => orders);

import { PATCH } from "@/app/api/admin/shop/orders/[id]/route";

const call = (body: unknown) =>
  PATCH(
    new Request("http://localhost/x", { method: "PATCH", body: JSON.stringify(body) }),
    { params: Promise.resolve({ id: "o1" }) },
  );

beforeEach(() => {
  vi.clearAllMocks();
  db = makeFakeDb({ shop_orders: [{ id: "o1", user_id: "u1", status: "paid" }] });
  auth.requireAdmin.mockResolvedValue({ session: { userId: "admin-1" } });
  auth.requirePermission.mockResolvedValue({ session: { userId: "admin-1" } });
});

describe("PATCH /api/admin/shop/orders/[id]", () => {
  it("M7: a refund needs the finance 'escrow_refund' permission", async () => {
    await call({ action: "refund" });
    expect(auth.requirePermission).toHaveBeenCalledWith("escrow_refund");
    expect(orders.refundShopOrder).toHaveBeenCalledWith(expect.objectContaining({ orderId: "o1", actorId: "admin-1" }));
  });

  it("M7: an admin without that permission gets 403 and nothing is refunded", async () => {
    auth.requirePermission.mockRejectedValue(new AdminAuthError("Permission denied (escrow_refund).", 403, "permission_denied"));
    const res = await call({ action: "refund" });
    expect(res.status).toBe(403);
    expect(orders.refundShopOrder).not.toHaveBeenCalled();
  });

  it("cancel only needs a normal admin session and passes the actor for the audit trail", async () => {
    db.tables.shop_orders[0].status = "pending_payment";
    await call({ action: "cancel", reason: "customer asked" });
    expect(auth.requirePermission).not.toHaveBeenCalled();
    expect(orders.cancelUnpaidOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "o1", userId: "u1", actorId: "admin-1", reason: "customer asked" }),
    );
  });

  it("cannot cancel a paid order or refund an unpaid one", async () => {
    expect((await call({ action: "cancel" })).status).toBe(400);
    db.tables.shop_orders[0].status = "pending_payment";
    expect((await call({ action: "refund" })).status).toBe(400);
    expect(orders.refundShopOrder).not.toHaveBeenCalled();
  });

  it("a refund_pending order can be retried", async () => {
    db.tables.shop_orders[0].status = "refund_pending";
    const res = await call({ action: "refund" });
    expect(res.status).toBe(200);
    expect(orders.refundShopOrder).toHaveBeenCalled();
  });

  it("a gateway failure is reported to the admin, not hidden", async () => {
    orders.refundShopOrder.mockRejectedValue(new Error("Gateway did not complete the refund: nope"));
    const res = await call({ action: "refund" });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Gateway did not complete the refund");
  });

  it("unknown order -> 404; bad body -> 400", async () => {
    db.tables.shop_orders = [];
    expect((await call({ action: "refund" })).status).toBe(404);
    expect((await call({ action: "explode" })).status).toBe(400);
  });
});
