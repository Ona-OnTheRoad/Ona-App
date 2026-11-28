import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "@/lib/server/shop/__tests__/fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => db.client }));
vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    userId: "user-1",
    email: "a@b.co",
    token: "t",
    user: { email: "a@b.co", user_metadata: {}, phone: null },
  })),
}));

const cartMod = vi.hoisted(() => ({ getOrCreateCart: vi.fn() }));
vi.mock("@/lib/server/shop/cart", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/shop/cart")>("@/lib/server/shop/cart");
  return { ...actual, getOrCreateCart: cartMod.getOrCreateCart };
});
const ordersMod = vi.hoisted(() => ({ createOrderFromCart: vi.fn() }));
vi.mock("@/lib/server/shop/orders", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/shop/orders")>("@/lib/server/shop/orders");
  return { ...actual, createOrderFromCart: ordersMod.createOrderFromCart };
});
const payMod = vi.hoisted(() => ({ createShopPaymentAndInit: vi.fn() }));
vi.mock("@/lib/server/shop/payments", () => payMod);
const delMod = vi.hoisted(() => ({ estimateDelivery: vi.fn() }));
vi.mock("@/lib/server/shop/delivery", () => delMod);

import { POST } from "@/app/api/shop/checkout/route";

const ADDR = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";
const line = (over = {}) => ({
  variantId: "v1", qty: 1, unitPriceMinor: 1000, lineTotalMinor: 1000,
  productName: "Pad", inStock: true, ...over,
});
const cart = (over: Record<string, unknown> = {}) => ({
  id: "c1", userId: "user-1", items: [line()], subtotalMinor: 1000, itemCount: 1, ...over,
});
const estimate = (zoneCode = "default") => ({
  deliveryFeeMinor: 500, zoneCode, zoneName: "Lagos", serviceCode: "std",
  etaMinutesMin: 30, etaMinutesMax: 60, freeDelivery: false,
});

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/shop/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as never,
  );

beforeEach(() => {
  vi.clearAllMocks();
  db = makeFakeDb({
    user_addresses: [{ id: ADDR, user_id: "user-1", label: "Home", address_text: "1 Road", delivery_zone_code: "island" }],
  });
  cartMod.getOrCreateCart.mockResolvedValue(cart());
  delMod.estimateDelivery.mockResolvedValue(estimate("island"));
  ordersMod.createOrderFromCart.mockResolvedValue({ orderId: "o1", orderNumber: "OS-1", totalMinor: 1500, alreadyExists: false });
  payMod.createShopPaymentAndInit.mockResolvedValue({ paymentId: "p1", reference: "shop_r", authorizationUrl: "https://pay/x", provider: "flutterwave", amountMinor: 1500 });
});

describe("POST /api/shop/checkout", () => {
  it("happy path returns the order + payment link, fee computed server-side", async () => {
    const res = await post({ addressId: ADDR });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toMatchObject({ orderId: "o1", payment: { authorizationUrl: "https://pay/x" }, delivery: { deliveryFeeMinor: 500 } });
    expect(delMod.estimateDelivery).toHaveBeenCalledTimes(1);
  });

  it("H2: does NOT overwrite the saved zone when the buyer did not pick one", async () => {
    await post({ addressId: ADDR, zoneCode: null });
    await post({ addressId: ADDR });
    expect(db.tables.user_addresses[0].delivery_zone_code).toBe("island");
    // and the saved zone is what the delivery engine was asked to use
    expect(delMod.estimateDelivery).toHaveBeenCalledWith(expect.objectContaining({ zoneCode: "island" }));
  });

  it("H2: remembers a zone the buyer explicitly picked (and the server accepted)", async () => {
    delMod.estimateDelivery.mockResolvedValue(estimate("mainland"));
    await post({ addressId: ADDR, zoneCode: "mainland" });
    expect(db.tables.user_addresses[0].delivery_zone_code).toBe("mainland");
  });

  it("H2: an unknown zone the server rejected (fell back) is not persisted", async () => {
    delMod.estimateDelivery.mockResolvedValue(estimate("default"));
    await post({ addressId: ADDR, zoneCode: "made-up" });
    expect(db.tables.user_addresses[0].delivery_zone_code).toBe("island");
  });

  it("B4: the idempotency token changes when the address / zone / price changes", async () => {
    await post({ addressId: ADDR });
    delMod.estimateDelivery.mockResolvedValue(estimate("mainland"));
    await post({ addressId: ADDR, zoneCode: "mainland" });
    cartMod.getOrCreateCart.mockResolvedValue(cart({ items: [line({ unitPriceMinor: 1200 })] }));
    await post({ addressId: ADDR });
    const tokens = ordersMod.createOrderFromCart.mock.calls.map((c) => c[0].checkoutToken);
    expect(new Set(tokens).size).toBe(3);
  });

  it("requires an address and that the address belongs to the caller", async () => {
    expect((await post({})).status).toBe(400);
    db.tables.user_addresses[0].user_id = "someone-else";
    expect((await post({ addressId: ADDR })).status).toBe(404);
  });

  it("rejects an invalid / empty cart with 400", async () => {
    cartMod.getOrCreateCart.mockResolvedValue(cart({ items: [] }));
    expect((await post({ addressId: ADDR })).status).toBe(400);
    cartMod.getOrCreateCart.mockResolvedValue(cart({ items: [line({ inStock: false })] }));
    const res = await post({ addressId: ADDR });
    expect(res.status).toBe(400);
  });

  it("M5: known cart/stock problems -> 409 with the message", async () => {
    ordersMod.createOrderFromCart.mockRejectedValue(new Error("Pad is out of stock"));
    const res = await post({ addressId: ADDR });
    expect(res.status).toBe(409);
    expect((await res.json()).error?.message ?? (await res.clone().text())).toBeDefined();
  });

  it("M5: unexpected errors are logged and NOT leaked to the client", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    payMod.createShopPaymentAndInit.mockRejectedValue(new Error('relation "shop_payments" violates secret_internal_detail'));
    const res = await post({ addressId: ADDR });
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(text).not.toContain("secret_internal_detail");
    expect(text).toMatch(/try again/i);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
