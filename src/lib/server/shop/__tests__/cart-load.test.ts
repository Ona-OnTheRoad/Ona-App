import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "./fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => db.client }));

import { addToCart, loadCart } from "@/lib/server/shop/cart";

const U = "u1";

beforeEach(() => {
  db = makeFakeDb({
    shop_carts: [{ id: "c1", user_id: U, account_context: "motorist", currency: "NGN", status: "open" }],
    shop_cart_items: [
      { id: "i1", cart_id: "c1", variant_id: "v1", qty: 2 },
      { id: "i2", cart_id: "c1", variant_id: "v2", qty: 1 },
      { id: "i3", cart_id: "c1", variant_id: "v-gone", qty: 1 },
    ],
    shop_product_variants: [
      { id: "v1", product_id: "p1", sku: "S1", title: "Front" },
      { id: "v2", product_id: "p2", sku: "S2", title: "Rear" },
    ],
    shop_products: [
      { id: "p1", name: "Pad", slug: "pad" },
      { id: "p2", name: "Disc", slug: "disc" },
    ],
    shop_prices: [
      { variant_id: "v1", amount_minor: 1000, is_active: true, effective_from: "2026-01-01T00:00:00Z", effective_to: null },
      { variant_id: "v1", amount_minor: 1, is_active: true, effective_from: "2099-01-01T00:00:00Z", effective_to: null },
      { variant_id: "v2", amount_minor: 500, is_active: true, effective_from: "2026-01-01T00:00:00Z", effective_to: null },
    ],
    shop_inventory: [
      { variant_id: "v1", qty_on_hand: 3, qty_reserved: 0 },
      { variant_id: "v1", qty_on_hand: 2, qty_reserved: 1 },
      { variant_id: "v2", qty_on_hand: 0, qty_reserved: 0 },
    ],
  });
});

describe("loadCart (M1 batched, M2 price window)", () => {
  it("builds lines with live price, summed stock across locations and totals", async () => {
    const cart = await loadCart("c1");
    expect(cart.items.map((l) => l.variantId)).toEqual(["v1", "v2"]); // orphan variant skipped
    const v1 = cart.items[0];
    expect(v1).toMatchObject({
      productName: "Pad",
      unitPriceMinor: 1000, // future-dated price NOT used
      lineTotalMinor: 2000,
      availableQty: 4, // (3-0)+(2-1)
      inStock: true,
    });
    expect(cart.items[1]).toMatchObject({ inStock: false, availableQty: 0 });
    expect(cart.subtotalMinor).toBe(2500);
    expect(cart.itemCount).toBe(3);
  });

  it("an empty cart loads without extra queries failing", async () => {
    db.tables.shop_cart_items = [];
    const cart = await loadCart("c1");
    expect(cart).toMatchObject({ items: [], subtotalMinor: 0, itemCount: 0 });
  });
});

describe("addToCart", () => {
  it("adds, then increases the same line, respecting stock", async () => {
    db.tables.shop_cart_items = [];
    await addToCart({ userId: U, variantId: "v1", qty: 2 });
    const c = await addToCart({ userId: U, variantId: "v1", qty: 1 });
    expect(c.items[0].qty).toBe(3);
    await expect(addToCart({ userId: U, variantId: "v1", qty: 5 })).rejects.toThrow(/Only 4 available/);
  });

  it("rejects out-of-stock and unpriced items", async () => {
    await expect(addToCart({ userId: U, variantId: "v2", qty: 1 })).rejects.toThrow(/out of stock/);
    db.tables.shop_inventory.push({ variant_id: "v3", qty_on_hand: 5, qty_reserved: 0 });
    await expect(addToCart({ userId: U, variantId: "v3", qty: 1 })).rejects.toThrow(/no active price/);
  });

  it("M4: survives a concurrent insert of the same line (unique violation)", async () => {
    db.tables.shop_cart_items = [];
    // Simulate the race: our insert fails with 23505 because another request won.
    db.failNext.shop_cart_items = { message: "duplicate key", code: "23505" };
    const orig = db.tables.shop_cart_items;
    orig.push({ id: "raced", cart_id: "c1", variant_id: "v1", qty: 1 });
    // existing lookup happens first and sees "raced" -> update path; force the insert path:
    db.tables.shop_cart_items = [];
    const realFrom = db.client.from;
    let injected = false;
    db.client.from = (t: string) => {
      const b = realFrom(t) as Record<string, (...a: unknown[]) => unknown>;
      if (t === "shop_cart_items" && !injected) {
        const origInsert = b.insert;
        b.insert = (p: unknown) => {
          injected = true;
          db.tables.shop_cart_items.push({ id: "raced", cart_id: "c1", variant_id: "v1", qty: 1 });
          return origInsert.call(b, p);
        };
      }
      return b;
    };
    const cart = await addToCart({ userId: U, variantId: "v1", qty: 1 });
    expect(cart.items.find((l) => l.variantId === "v1")?.qty).toBe(2);
  });
});
