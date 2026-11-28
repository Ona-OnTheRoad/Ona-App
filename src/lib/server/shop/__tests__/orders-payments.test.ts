import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "./fake-supabase";

let db: FakeDb;

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: () => db.client,
}));

const providers = vi.hoisted(() => ({
  verifyCharge: vi.fn(),
  initCharge: vi.fn(),
  resolveProvider: vi.fn(() => "flutterwave"),
  attemptFlutterwaveRefund: vi.fn(),
  isProductionRuntime: vi.fn(() => false),
}));
vi.mock("@/lib/server/payments/providers", () => providers);

const events = vi.hoisted(() => ({
  notifyShopBuyer: vi.fn(async () => undefined),
  auditShop: vi.fn(async () => undefined),
}));
vi.mock("@/lib/server/shop/shop-events", () => events);

const cartMock = vi.hoisted(() => ({ loadCart: vi.fn() }));
vi.mock("@/lib/server/shop/cart", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/shop/cart")>(
    "@/lib/server/shop/cart",
  );
  return { ...actual, loadCart: cartMock.loadCart };
});

import {
  buildCheckoutToken,
  cancelUnpaidOrder,
  createOrderFromCart,
  markShopOrderPaid,
  refundCapturedPayment,
  refundShopOrder,
} from "@/lib/server/shop/orders";
import {
  createShopPaymentAndInit,
  isDefinitiveChargeFailure,
  verifyShopPayment,
} from "@/lib/server/shop/payments";

const U = "11111111-1111-1111-1111-111111111111";
const O = "22222222-2222-2222-2222-222222222222";

function order(over: Record<string, unknown> = {}) {
  return {
    id: O,
    user_id: U,
    order_number: "OS-TEST",
    account_context: "motorist",
    status: "pending_payment",
    total_minor: 150000,
    currency: "NGN",
    ...over,
  };
}
function payment(over: Record<string, unknown> = {}) {
  return {
    id: "pay-1",
    order_id: O,
    user_id: U,
    provider: "flutterwave",
    provider_ref: "shop_ref_1",
    amount_minor: 150000,
    status: "pending",
    created_at: "2026-11-28T00:00:00Z",
    ...over,
  };
}
const cart = (over: Record<string, unknown> = {}) => ({
  id: "cart-1",
  userId: U,
  accountContext: "motorist",
  currency: "NGN",
  subtotalMinor: 100000,
  itemCount: 2,
  items: [
    {
      id: "ci-1",
      variantId: "v-1",
      productId: "p-1",
      productName: "Brake pad",
      productSlug: "brake-pad",
      variantTitle: "Front",
      sku: "BP-1",
      qty: 2,
      unitPriceMinor: 50000,
      lineTotalMinor: 100000,
      inStock: true,
      availableQty: 5,
    },
  ],
  ...over,
});
const delivery = {
  deliveryFeeMinor: 5000,
  zoneCode: "default",
  zoneName: "Lagos",
  serviceCode: "standard",
  etaMinutesMin: 30,
  etaMinutesMax: 60,
};

function rpcPay(outcome: string) {
  db.rpcs.ona_shop_pay_order = () => outcome;
  db.rpcs.ona_shop_restock_order = () => 1;
}

beforeEach(() => {
  vi.clearAllMocks();
  providers.resolveProvider.mockReturnValue("flutterwave");
  providers.isProductionRuntime.mockReturnValue(false);
  db = makeFakeDb({
    shop_orders: [order()],
    shop_payments: [payment()],
    shop_order_items: [{ order_id: O, variant_id: "v-1" }],
    shop_carts: [{ id: "cart-1", user_id: U, account_context: "motorist", status: "open" }],
    shop_cart_items: [{ id: "ci-1", cart_id: "cart-1", variant_id: "v-1" }],
    shop_deliveries: [{ order_id: O, status: "pending" }],
  });
});

describe("buildCheckoutToken (B4)", () => {
  const base = {
    cartId: "c",
    items: [
      { variantId: "a", qty: 1, unitPriceMinor: 100 },
      { variantId: "b", qty: 2, unitPriceMinor: 200 },
    ],
    addressId: "addr-1",
    zoneCode: "default",
    deliveryFeeMinor: 500,
    subtotalMinor: 500,
  };
  it("is stable regardless of item order", () => {
    const flipped = { ...base, items: [...base.items].reverse() };
    expect(buildCheckoutToken(flipped)).toBe(buildCheckoutToken(base));
  });
  it.each([
    ["address", { addressId: "addr-2" }],
    ["zone", { zoneCode: "island" }],
    ["delivery fee", { deliveryFeeMinor: 900 }],
    ["subtotal", { subtotalMinor: 1 }],
    ["quantity", { items: [{ variantId: "a", qty: 9, unitPriceMinor: 100 }, base.items[1]] }],
    ["price", { items: [{ variantId: "a", qty: 1, unitPriceMinor: 101 }, base.items[1]] }],
  ])("changes when the %s changes", (_n, patch) => {
    expect(buildCheckoutToken({ ...base, ...patch })).not.toBe(buildCheckoutToken(base));
  });
});

describe("createOrderFromCart", () => {
  const input = {
    userId: U,
    accountContext: "motorist" as const,
    cartId: "cart-1",
    checkoutToken: "cart:cart-1:abc",
    shipToAddressId: "addr-1",
    shipToSnapshot: {},
    delivery,
  };

  beforeEach(() => {
    cartMock.loadCart.mockResolvedValue(cart());
  });

  it("creates the order + items through the single atomic RPC", async () => {
    db.tables.shop_orders = [];
    db.rpcs.ona_shop_create_order = (a) => ({
      alreadyExists: false,
      id: "new-1",
      orderNumber: (a.p_order as { order_number: string }).order_number,
      totalMinor: 105000,
      status: "pending_payment",
    });
    const res = await createOrderFromCart(input);
    expect(res).toMatchObject({ orderId: "new-1", totalMinor: 105000, alreadyExists: false });
    const call = db.rpcCalls.find((c) => c.name === "ona_shop_create_order")!;
    const p = call.args.p_order as Record<string, unknown>;
    expect(p.total_minor).toBe(105000); // server-computed: subtotal + fee
    expect(p.checkout_token).toBe("cart:cart-1:abc");
    expect((call.args.p_items as unknown[]).length).toBe(1);
  });

  it("returns the existing order when the token matches a PAYABLE order", async () => {
    db.tables.shop_orders = [order({ checkout_token: "cart:cart-1:abc" })];
    const res = await createOrderFromCart(input);
    expect(res).toMatchObject({ orderId: O, alreadyExists: true });
    expect(db.rpcCalls).toHaveLength(0);
  });

  it("B4: never reuses a token that belongs to a cancelled / refunded / paid order", async () => {
    for (const status of ["cancelled", "refunded", "paid"]) {
      db.rpcCalls.length = 0;
      db.tables.shop_orders = [order({ status, checkout_token: "cart:cart-1:abc" })];
      db.rpcs.ona_shop_create_order = () => ({
        alreadyExists: false,
        id: "fresh",
        orderNumber: "OS-NEW",
        totalMinor: 105000,
        status: "pending_payment",
      });
      const res = await createOrderFromCart(input);
      expect(res.orderId, status).toBe("fresh");
      const p = db.rpcCalls[0].args.p_order as { checkout_token: string };
      expect(p.checkout_token, status).not.toBe("cart:cart-1:abc");
      expect(p.checkout_token, status).toMatch(/^cart:cart-1:abc:/);
    }
  });

  it("retries with a new order number on an order_number collision", async () => {
    db.tables.shop_orders = [];
    let n = 0;
    db.rpcs.ona_shop_create_order = () => {
      if (++n < 3) {
        throw new Error('duplicate key value violates unique constraint "shop_orders_order_number_key" on order_number');
      }
      return { alreadyExists: false, id: "ok", orderNumber: "X", totalMinor: 1, status: "pending_payment" };
    };
    const res = await createOrderFromCart(input);
    expect(res.orderId).toBe("ok");
    expect(n).toBe(3);
  });

  it("surfaces a real database error instead of swallowing it", async () => {
    db.tables.shop_orders = [];
    db.rpcs.ona_shop_create_order = () => {
      throw new Error("boom");
    };
    await expect(createOrderFromCart(input)).rejects.toThrow("boom");
  });

  it("rejects another user's cart and out-of-stock carts", async () => {
    db.tables.shop_orders = [];
    cartMock.loadCart.mockResolvedValue(cart({ userId: "someone-else" }));
    await expect(createOrderFromCart(input)).rejects.toThrow("Forbidden");
    cartMock.loadCart.mockResolvedValue(
      cart({ items: [{ ...cart().items[0], inStock: false }] }),
    );
    await expect(createOrderFromCart(input)).rejects.toThrow(/out of stock/);
  });
});

describe("markShopOrderPaid (B3)", () => {
  it.each(["paid", "already_paid", "insufficient_stock", "invalid_status", "not_found"])(
    "passes the atomic outcome through: %s",
    async (outcome) => {
      rpcPay(outcome);
      expect(await markShopOrderPaid({ orderId: O, paymentId: "pay-1" })).toBe(outcome);
    },
  );

  it("does the cart cleanup + notification only for the call that actually paid", async () => {
    rpcPay("already_paid");
    await markShopOrderPaid({ orderId: O, paymentId: "pay-1" });
    expect(events.notifyShopBuyer).not.toHaveBeenCalled();
    expect(db.tables.shop_cart_items).toHaveLength(1);

    rpcPay("paid");
    await markShopOrderPaid({ orderId: O, paymentId: "pay-1" });
    expect(events.notifyShopBuyer).toHaveBeenCalledTimes(1);
    expect(db.tables.shop_cart_items).toHaveLength(0);
    expect(db.tables.shop_carts[0].status).toBe("converted");
  });

  it("keeps items the buyer added after checkout started", async () => {
    db.tables.shop_cart_items.push({ id: "ci-2", cart_id: "cart-1", variant_id: "v-NEW" });
    rpcPay("paid");
    await markShopOrderPaid({ orderId: O, paymentId: "pay-1" });
    expect(db.tables.shop_cart_items.map((i) => i.variant_id)).toEqual(["v-NEW"]);
    expect(db.tables.shop_carts[0].status).toBe("open");
  });

  it("throws when the RPC itself fails (so the caller can retry)", async () => {
    db.rpcs.ona_shop_pay_order = () => {
      throw new Error("db down");
    };
    await expect(markShopOrderPaid({ orderId: O, paymentId: "p" })).rejects.toThrow("db down");
  });
});

describe("verifyShopPayment", () => {
  const ok = { success: true, amountMinor: 150000, paidAt: "2026-11-28T01:00:00Z", raw: {} };

  it("M6: a charge the gateway has not finished stays PENDING (not failed)", async () => {
    providers.verifyCharge.mockResolvedValue({ success: false, amountMinor: 0, raw: { status: "error", message: "No transaction was found" } });
    const r = await verifyShopPayment({ reference: "shop_ref_1", userId: U });
    expect(r).toMatchObject({ success: false, pending: true });
    expect(db.tables.shop_payments[0].status).toBe("pending");
  });

  it("M6: a pending payment can still be confirmed later", async () => {
    providers.verifyCharge.mockResolvedValueOnce({ success: false, amountMinor: 0, raw: {} });
    await verifyShopPayment({ reference: "shop_ref_1" });
    providers.verifyCharge.mockResolvedValueOnce(ok);
    rpcPay("paid");
    const r = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(r).toMatchObject({ success: true });
    expect(db.tables.shop_payments[0].status).toBe("succeeded");
  });

  it("marks failed only on a definitive provider failure", async () => {
    providers.verifyCharge.mockResolvedValue({ success: false, amountMinor: 0, raw: { data: { status: "failed" } } });
    const r = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(r).toMatchObject({ success: false });
    expect(r.pending).toBeUndefined();
    expect(db.tables.shop_payments[0].status).toBe("failed");
  });

  it("success: records the payment and pays the order", async () => {
    providers.verifyCharge.mockResolvedValue(ok);
    rpcPay("paid");
    const r = await verifyShopPayment({ reference: "shop_ref_1", userId: U });
    expect(r).toEqual({ success: true, orderId: O });
    expect(db.tables.shop_payments[0]).toMatchObject({ status: "succeeded" });
  });

  it("B3: confirming the same payment again is a harmless 'already paid'", async () => {
    providers.verifyCharge.mockResolvedValue(ok);
    db.rpcs.ona_shop_restock_order = () => 0;
    let first = true;
    db.rpcs.ona_shop_pay_order = () => {
      const out = first ? "paid" : "already_paid";
      first = false;
      return out;
    };
    const a = await verifyShopPayment({ reference: "shop_ref_1" });
    const b = await verifyShopPayment({ reference: "shop_ref_1" });
    const c = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(a.success && !a.alreadyPaid).toBe(true);
    expect(b).toMatchObject({ success: true, alreadyPaid: true });
    expect(c).toMatchObject({ success: true, alreadyPaid: true });
    // second/third confirms never hit the provider again
    expect(providers.verifyCharge).toHaveBeenCalledTimes(1);
  });

  it("finishes the order when the payment was recorded but the order step never ran", async () => {
    db.tables.shop_payments[0].status = "succeeded";
    rpcPay("paid");
    const r = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(r).toMatchObject({ success: true });
    expect(providers.verifyCharge).not.toHaveBeenCalled();
  });

  it("B2: stock ran out after payment -> REAL gateway refund, then marked refunded", async () => {
    providers.verifyCharge.mockResolvedValue(ok);
    providers.attemptFlutterwaveRefund.mockResolvedValue({ ok: true, status: "completed" });
    rpcPay("insufficient_stock");
    const r = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(providers.attemptFlutterwaveRefund).toHaveBeenCalledWith(
      expect.objectContaining({ providerRef: "shop_ref_1" }),
    );
    expect(r).toMatchObject({ success: false, refunded: true });
    expect(r.message).toMatch(/refunded/i);
    expect(db.tables.shop_orders[0].status).toBe("refunded");
    expect(db.tables.shop_payments[0].status).toBe("refunded");
  });

  it("B2: if the gateway refuses, the order is NOT labelled refunded", async () => {
    providers.verifyCharge.mockResolvedValue(ok);
    providers.attemptFlutterwaveRefund.mockResolvedValue({ ok: false, code: "gateway", message: "insufficient wallet balance" });
    rpcPay("insufficient_stock");
    const r = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(r).toMatchObject({ success: false, refundPending: true });
    expect(r.refunded).toBeUndefined();
    expect(r.message).not.toMatch(/has been refunded/i);
    expect(db.tables.shop_orders[0]).toMatchObject({
      status: "refund_pending",
      refund_error: "insufficient wallet balance",
    });
    expect(db.tables.shop_payments[0].status).toBe("succeeded"); // money still captured
  });

  it("refunds when the order was cancelled while the customer was paying", async () => {
    providers.verifyCharge.mockResolvedValue(ok);
    providers.attemptFlutterwaveRefund.mockResolvedValue({ ok: true, status: "completed" });
    rpcPay("invalid_status");
    const r = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(r).toMatchObject({ success: false, refunded: true });
  });

  it("amount mismatch: fails the payment and throws", async () => {
    providers.verifyCharge.mockResolvedValue({ ...ok, amountMinor: 100 });
    await expect(verifyShopPayment({ reference: "shop_ref_1" })).rejects.toThrow(/amount mismatch/i);
    expect(db.tables.shop_payments[0].status).toBe("failed");
  });

  it("will not let another user verify someone else's payment", async () => {
    await expect(verifyShopPayment({ reference: "shop_ref_1", userId: "intruder" })).rejects.toThrow("Forbidden");
  });

  it("a refunded payment is never re-confirmed", async () => {
    db.tables.shop_payments[0].status = "refunded";
    const r = await verifyShopPayment({ reference: "shop_ref_1" });
    expect(r).toMatchObject({ success: false, refunded: true });
    expect(providers.verifyCharge).not.toHaveBeenCalled();
  });

  it("unknown reference", async () => {
    await expect(verifyShopPayment({ reference: "nope" })).rejects.toThrow(/not found/);
  });
});

describe("isDefinitiveChargeFailure", () => {
  it.each([
    [{ data: { status: "failed" } }, true],
    [{ data: { status: "cancelled" } }, true],
    [{ data: { status: "pending" } }, false],
    [{ status: "error", message: "No transaction was found" }, false],
    [null, false],
  ])("%j -> %s", (raw, expected) => {
    expect(isDefinitiveChargeFailure(raw)).toBe(expected);
  });
});

describe("refundCapturedPayment / refundShopOrder (B2, B6)", () => {
  beforeEach(() => {
    db.tables.shop_orders[0] = order({ status: "paid" });
    db.tables.shop_payments[0] = payment({ status: "succeeded" });
    db.rpcs.ona_shop_restock_order = () => 1;
  });

  it("refunds at the gateway, restocks, and only then marks refunded", async () => {
    providers.attemptFlutterwaveRefund.mockResolvedValue({ ok: true, status: "completed" });
    await refundShopOrder({ orderId: O, actorId: "admin-1", reason: "damaged" });
    expect(providers.attemptFlutterwaveRefund).toHaveBeenCalledTimes(1);
    expect(db.rpcCalls.map((c) => c.name)).toContain("ona_shop_restock_order");
    expect(db.tables.shop_orders[0]).toMatchObject({ status: "refunded" });
    expect(db.tables.shop_payments[0]).toMatchObject({ status: "refunded" });
    expect(db.tables.shop_deliveries[0].status).toBe("cancelled");
    expect(events.auditShop).toHaveBeenCalledWith(expect.objectContaining({ action: "order_refund", actorId: "admin-1" }));
    expect(events.notifyShopBuyer).toHaveBeenCalled();
  });

  it("gateway failure: order -> refund_pending, NO restock, error surfaced to the admin", async () => {
    providers.attemptFlutterwaveRefund.mockResolvedValue({ ok: false, code: "gateway", message: "nope" });
    await expect(refundShopOrder({ orderId: O })).rejects.toThrow(/refund pending/i);
    expect(db.tables.shop_orders[0]).toMatchObject({ status: "refund_pending", refund_error: "nope" });
    expect(db.tables.shop_payments[0].status).toBe("succeeded");
    expect(db.rpcCalls.map((c) => c.name)).not.toContain("ona_shop_restock_order");
    expect(events.auditShop).toHaveBeenCalledWith(expect.objectContaining({ action: "order_refund_failed" }));
  });

  it("a refund_pending order can be retried and then completes", async () => {
    db.tables.shop_orders[0] = order({ status: "refund_pending", refund_error: "nope" });
    providers.attemptFlutterwaveRefund.mockResolvedValue({ ok: true, status: "completed" });
    await refundShopOrder({ orderId: O });
    expect(db.tables.shop_orders[0]).toMatchObject({ status: "refunded", refund_error: null });
  });

  it.each(["pending_payment", "cancelled", "refunded", "delivered"])(
    "refuses to refund a %s order",
    async (status) => {
      db.tables.shop_orders[0] = order({ status });
      await expect(refundShopOrder({ orderId: O })).rejects.toThrow(/Only paid orders/);
      expect(providers.attemptFlutterwaveRefund).not.toHaveBeenCalled();
    },
  );

  it("unsupported provider -> refund_pending with a clear manual-action message", async () => {
    db.tables.shop_payments[0] = payment({ status: "succeeded", provider: "paystack" });
    await expect(refundShopOrder({ orderId: O })).rejects.toThrow(/not supported/i);
    expect(db.tables.shop_orders[0].status).toBe("refund_pending");
  });

  it("mock provider refunds succeed outside production, fail in production", async () => {
    db.tables.shop_payments[0] = payment({ status: "succeeded", provider: "mock" });
    await refundShopOrder({ orderId: O });
    expect(db.tables.shop_orders[0].status).toBe("refunded");

    db.tables.shop_orders[0] = order({ status: "paid" });
    db.tables.shop_payments[0] = payment({ status: "succeeded", provider: "mock" });
    providers.isProductionRuntime.mockReturnValue(true);
    await expect(refundShopOrder({ orderId: O })).rejects.toThrow();
  });

  it("still marks refunded (and logs) if only the restock step fails after money moved", async () => {
    providers.attemptFlutterwaveRefund.mockResolvedValue({ ok: true, status: "completed" });
    db.rpcs.ona_shop_restock_order = () => {
      throw new Error("restock down");
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await refundShopOrder({ orderId: O });
    expect(db.tables.shop_orders[0].status).toBe("refunded");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("refundCapturedPayment with no successful payment -> refund_pending, not 'refunded'", async () => {
    db.tables.shop_payments = [];
    const r = await refundCapturedPayment({ orderId: O, reason: "x" });
    expect(r).toMatchObject({ refunded: false });
    expect(db.tables.shop_orders[0].status).toBe("refund_pending");
  });
});

describe("cancelUnpaidOrder (H3)", () => {
  it("cancels a pending order, voids its pending payment, audits + notifies", async () => {
    await cancelUnpaidOrder({ orderId: O, userId: U });
    expect(db.tables.shop_orders[0].status).toBe("cancelled");
    expect(db.tables.shop_payments[0].status).toBe("cancelled");
    expect(events.auditShop).toHaveBeenCalledWith(expect.objectContaining({ action: "order_cancel" }));
    expect(events.notifyShopBuyer).toHaveBeenCalled();
  });

  it("refuses a paid order (cannot cancel money that moved)", async () => {
    db.tables.shop_orders[0] = order({ status: "paid" });
    await expect(cancelUnpaidOrder({ orderId: O, userId: U })).rejects.toThrow(/unpaid/);
    expect(db.tables.shop_orders[0].status).toBe("paid");
  });

  it("refuses someone else's order", async () => {
    await expect(cancelUnpaidOrder({ orderId: O, userId: "intruder" })).rejects.toThrow("Order not found");
  });
});

describe("createShopPaymentAndInit", () => {
  const args = { orderId: O, userId: U, email: "a@b.co", idempotencyKey: `shop-checkout-${O}` };
  beforeEach(() => {
    providers.initCharge.mockResolvedValue({
      provider: "flutterwave",
      reference: "shop_new_ref",
      authorizationUrl: "https://pay.example/x",
    });
    db.tables.shop_payments = [];
  });

  it("creates a payment row and returns the checkout link", async () => {
    const r = await createShopPaymentAndInit(args);
    expect(r).toMatchObject({ reference: "shop_new_ref", authorizationUrl: "https://pay.example/x", amountMinor: 150000 });
    expect(db.tables.shop_payments[0]).toMatchObject({ status: "pending", idempotency_key: args.idempotencyKey });
  });

  it("reuses a still-usable pending payment (double-click safe)", async () => {
    db.tables.shop_payments = [
      payment({ idempotency_key: args.idempotencyKey, raw_init: { authorizationUrl: "https://pay.example/old" } }),
    ];
    const r = await createShopPaymentAndInit(args);
    expect(r.reference).toBe("shop_ref_1");
    expect(providers.initCharge).not.toHaveBeenCalled();
  });

  it("retry after a FAILED payment creates a fresh one (no idempotency-key clash)", async () => {
    db.tables.shop_payments = [
      payment({ status: "failed", idempotency_key: args.idempotencyKey }),
    ];
    const r = await createShopPaymentAndInit(args);
    expect(r.reference).toBe("shop_new_ref");
    expect(db.tables.shop_payments).toHaveLength(2);
    const keys = db.tables.shop_payments.map((p) => p.idempotency_key);
    expect(new Set(keys).size).toBe(2);
  });

  it("does not reuse a pending payment that has no checkout link", async () => {
    db.tables.shop_payments = [
      payment({ idempotency_key: args.idempotencyKey, raw_init: {} }),
    ];
    await createShopPaymentAndInit(args);
    expect(providers.initCharge).toHaveBeenCalled();
    expect(db.tables.shop_payments[0].status).toBe("cancelled");
  });

  it("refuses to pay an order that is not pending", async () => {
    db.tables.shop_orders[0] = order({ status: "cancelled" });
    await expect(createShopPaymentAndInit(args)).rejects.toThrow(/cannot pay/);
  });
});
