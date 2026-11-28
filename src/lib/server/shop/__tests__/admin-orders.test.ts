import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "./fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => db.client }));

import { getAdminOrderDetail, listAdminOrders, sanitizeSearch } from "@/lib/server/shop/admin-orders";

beforeEach(() => {
  db = makeFakeDb({
    shop_orders: [
      { id: "o1", order_number: "OS-AAA", status: "paid", total_minor: 1000, currency: "NGN", created_at: "2026-11-28T10:00:00Z", user_id: "u1", account_context: "motorist" },
      { id: "o2", order_number: "OS-BBB", status: "refund_pending", total_minor: 2000, currency: "NGN", created_at: "2026-11-28T11:00:00Z", user_id: "u2", account_context: "professional", refund_error: "wallet empty" },
      { id: "o3", order_number: "OS-CCC", status: "cancelled", total_minor: 300, currency: "NGN", created_at: "2026-11-27T11:00:00Z", user_id: "u1", account_context: "motorist" },
    ],
    profiles: [
      { id: "u1", full_name: "Ada", phone: "0801" },
      { id: "u2", full_name: "Bayo", phone: "0802" },
    ],
    shop_deliveries: [{ order_id: "o1", status: "assigned", courier_name: "Kemi" }],
    shop_order_items: [{ id: "i1", order_id: "o1", product_name: "Pad", qty: 1 }],
    shop_payments: [{ id: "p1", order_id: "o1", status: "succeeded", raw_init: { secret: 1 } }],
    shop_order_events: [{ id: "e1", order_id: "o1", event_type: "paid", created_at: "2026-11-28T10:01:00Z" }],
  });
});

describe("listAdminOrders", () => {
  it("lists newest first with buyer + delivery info and counts refunds needing action", async () => {
    const r = await listAdminOrders({});
    expect(r.orders.map((o) => o.order_number)).toEqual(["OS-BBB", "OS-AAA", "OS-CCC"]);
    expect(r.needsAttention).toBe(1);
    expect(r.orders.find((o) => o.id === "o1")).toMatchObject({
      buyer: { full_name: "Ada", phone: "0801" },
      delivery: { status: "assigned", courier_name: "Kemi" },
    });
    expect(r.orders.find((o) => o.id === "o2")).toMatchObject({
      refund_error: "wallet empty",
      account_context: "professional",
      delivery: null,
    });
  });
  it("filters by status, ignoring unknown statuses", async () => {
    expect((await listAdminOrders({ status: "paid" })).orders.map((o) => o.id)).toEqual(["o1"]);
    expect((await listAdminOrders({ status: "bogus" })).orders).toHaveLength(3);
  });
  it("searches by order number", async () => {
    expect((await listAdminOrders({ q: "bbb" })).orders.map((o) => o.id)).toEqual(["o2"]);
  });
  it("sanitizes search input so filter syntax can't be injected", () => {
    expect(sanitizeSearch("a%b_c,d(e)*f\\g")).toBe("a b c d e  f g");
    expect(sanitizeSearch("x".repeat(200))).toHaveLength(60);
  });
  it("clamps the limit", async () => {
    expect((await listAdminOrders({ limit: 1 })).orders).toHaveLength(1);
  });
});

describe("getAdminOrderDetail", () => {
  it("returns the order with items, payments, delivery, events and buyer", async () => {
    const d = await getAdminOrderDetail("o1");
    expect(d?.order.order_number).toBe("OS-AAA");
    expect(d?.buyer).toMatchObject({ full_name: "Ada" });
    expect(d?.items).toHaveLength(1);
    expect(d?.delivery).toMatchObject({ status: "assigned" });
    expect(d?.events).toHaveLength(1);
  });
  it("null for an unknown order", async () => {
    expect(await getAdminOrderDetail("nope")).toBeNull();
  });
});
