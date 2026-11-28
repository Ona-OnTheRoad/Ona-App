/**
 * Runs the real shop migrations (050 + 059 + 091) on an in-memory Postgres
 * (PGlite) and exercises the atomic pay / restock / create-order functions.
 * This is what proves the stock + payment fixes, since PostgREST mocks can't.
 */
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const MIG = path.resolve(__dirname, "../../../../../supabase/migrations");

function load(file: string): string {
  return fs
    .readFileSync(path.join(MIG, file), "utf8")
    .replace(
      /create index if not exists (shop_products_source_key_idx|shop_search_events_[a-z_]+)[^;]*;/g,
      "",
    )
    .replace(/create extension "pgcrypto"/g, "perform 1");
}

let db: PGlite;
let userId: string;
let locA: string;
let locB: string;
let variantId: string;
let catId: string;

async function one<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const r = await db.query<T>(sql, params);
  return r.rows[0];
}

async function stock(variant = variantId): Promise<{ a: number; b: number; reserved: number }> {
  const r = await db.query<{ location_id: string; qty_on_hand: number; qty_reserved: number }>(
    "select location_id, qty_on_hand, qty_reserved from shop_inventory where variant_id=$1",
    [variant],
  );
  const a = r.rows.find((x) => x.location_id === locA)?.qty_on_hand ?? 0;
  const b = r.rows.find((x) => x.location_id === locB)?.qty_on_hand ?? 0;
  const reserved = r.rows.reduce((s, x) => s + x.qty_reserved, 0);
  return { a, b, reserved };
}

async function makeOrder(
  qty: number,
  opts: { status?: string; variant?: string; token?: string } = {},
): Promise<string> {
  const v = opts.variant ?? variantId;
  const o = await one<{ id: string }>(
    `insert into shop_orders (order_number, user_id, status, subtotal_minor, total_minor, checkout_token,
       delivery_zone_code, delivery_service_code, delivery_eta_minutes, ship_to_snapshot)
     values ($1,$2,$3,1000,1000,$4,'default','standard',60,'{"deliveryZoneName":"Lagos"}'::jsonb) returning id`,
    [
      `OS-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      opts.status ?? "pending_payment",
      opts.token ?? null,
    ],
  );
  await db.query(
    `insert into shop_order_items (order_id, variant_id, product_name, variant_title, sku, qty, unit_price_minor, line_total_minor)
     values ($1,$2,'P','V','SKU',$3,500,$4)`,
    [o.id, v, qty, qty * 500],
  );
  return o.id;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role service_role; create role anon; create role authenticated;
    create table public.profiles (id uuid primary key default gen_random_uuid());
    create table public.user_addresses (id uuid primary key default gen_random_uuid());
    create table public.feature_flags (key text primary key, enabled boolean, description text);
  `);
  for (const f of [
    "20260809_050_ona_shop_core.sql",
    "20260809_059_shop_phase3.sql",
    "20261128_091_shop_payment_inventory_hardening.sql",
  ]) {
    await db.exec(load(f));
  }
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.exec(
    `truncate shop_order_stock, shop_order_events, shop_deliveries, shop_order_items, shop_orders,
       shop_inventory_transactions, shop_inventory, shop_inventory_locations, shop_product_variants,
       shop_products, shop_trade_categories, profiles cascade`,
  );
  userId = (await one<{ id: string }>("insert into profiles default values returning id")).id;
  locA = (
    await one<{ id: string }>(
      "insert into shop_inventory_locations (code,name) values ('A','A') returning id",
    )
  ).id;
  locB = (
    await one<{ id: string }>(
      "insert into shop_inventory_locations (code,name) values ('B','B') returning id",
    )
  ).id;
  catId = (
    await one<{ id: string }>(
      "insert into shop_trade_categories (trade_key,slug,name) values ('mechanic','c','C') returning id",
    )
  ).id;
  const prod = await one<{ id: string }>(
    "insert into shop_products (category_id,slug,name,trade_key) values ($1,'p','P','mechanic') returning id",
    [catId],
  );
  variantId = (
    await one<{ id: string }>(
      "insert into shop_product_variants (product_id,sku,title) values ($1,'SKU','V') returning id",
      [prod.id],
    )
  ).id;
});

async function seedStock(a: number, b = 0) {
  if (a > 0)
    await db.query(
      "insert into shop_inventory (variant_id, location_id, qty_on_hand) values ($1,$2,$3)",
      [variantId, locA, a],
    );
  if (b > 0)
    await db.query(
      "insert into shop_inventory (variant_id, location_id, qty_on_hand) values ($1,$2,$3)",
      [variantId, locB, b],
    );
}

const pay = async (orderId: string) =>
  (await one<{ r: string }>("select ona_shop_pay_order($1, null) as r", [orderId])).r;
const restock = async (orderId: string) =>
  Number((await one<{ r: number }>("select ona_shop_restock_order($1) as r", [orderId])).r);

describe("ona_shop_pay_order", () => {
  it("pays, deducts stock once, opens the delivery row", async () => {
    await seedStock(10);
    const o = await makeOrder(3);
    expect(await pay(o)).toBe("paid");
    expect((await stock()).a).toBe(7);
    const order = await one<{ status: string; paid_at: string | null }>(
      "select status, paid_at from shop_orders where id=$1",
      [o],
    );
    expect(order.status).toBe("paid");
    expect(order.paid_at).not.toBeNull();
    const d = await one<{ status: string; zone_name: string; eta_minutes: number }>(
      "select status, zone_name, eta_minutes from shop_deliveries where order_id=$1",
      [o],
    );
    expect(d).toMatchObject({ status: "pending", zone_name: "Lagos", eta_minutes: 60 });
  });

  it("B3: is idempotent, a second confirm does not deduct again", async () => {
    await seedStock(10);
    const o = await makeOrder(3);
    expect(await pay(o)).toBe("paid");
    expect(await pay(o)).toBe("already_paid");
    expect(await pay(o)).toBe("already_paid");
    expect((await stock()).a).toBe(7);
    const events = await one<{ n: number }>(
      "select count(*)::int n from shop_order_events where order_id=$1 and event_type='paid'",
      [o],
    );
    expect(events.n).toBe(1);
    const del = await one<{ n: number }>(
      "select count(*)::int n from shop_deliveries where order_id=$1",
      [o],
    );
    expect(del.n).toBe(1);
  });

  it("returns insufficient_stock and changes NOTHING (all lines checked first)", async () => {
    await seedStock(2);
    const prod2 = await one<{ id: string }>(
      "insert into shop_products (category_id,slug,name,trade_key) values ($1,'p2','P2','mechanic') returning id",
      [catId],
    );
    const v2 = (
      await one<{ id: string }>(
        "insert into shop_product_variants (product_id,sku,title) values ($1,'SKU2','V2') returning id",
        [prod2.id],
      )
    ).id;
    await db.query(
      "insert into shop_inventory (variant_id, location_id, qty_on_hand) values ($1,$2,5)",
      [v2, locA],
    );
    const o = await makeOrder(2); // line 1 fits
    await db.query(
      `insert into shop_order_items (order_id, variant_id, product_name, variant_title, sku, qty, unit_price_minor, line_total_minor)
       values ($1,$2,'P2','V2','SKU2',9,1,9)`,
      [o, v2], // line 2 does not fit
    );
    expect(await pay(o)).toBe("insufficient_stock");
    expect((await stock()).a).toBe(2); // line 1 untouched
    expect((await stock(v2)).a).toBe(5);
    expect(
      (await one<{ status: string }>("select status from shop_orders where id=$1", [o])).status,
    ).toBe("pending_payment");
    expect(
      (await one<{ n: number }>("select count(*)::int n from shop_order_stock")).n,
    ).toBe(0);
  });

  it("M3: satisfies an order from stock split across locations", async () => {
    await seedStock(1, 1);
    const o = await makeOrder(2);
    expect(await pay(o)).toBe("paid");
    const s = await stock();
    expect(s.a + s.b).toBe(0);
    expect(
      (await one<{ n: number }>("select count(*)::int n from shop_order_stock where order_id=$1", [o])).n,
    ).toBe(2);
  });

  it("does not sell units reserved by someone else", async () => {
    await seedStock(5);
    await db.query("update shop_inventory set qty_reserved=4 where variant_id=$1", [variantId]);
    const o = await makeOrder(2);
    expect(await pay(o)).toBe("insufficient_stock");
  });

  it("refuses cancelled / refunded orders", async () => {
    await seedStock(5);
    expect(await pay(await makeOrder(1, { status: "cancelled" }))).toBe("invalid_status");
    expect(await pay(await makeOrder(1, { status: "refunded" }))).toBe("invalid_status");
    expect(await pay("00000000-0000-0000-0000-000000000000")).toBe("not_found");
    expect((await stock()).a).toBe(5);
  });

  it("B5: last unit goes to exactly one of two sequential buyers (no false out-of-stock for the winner)", async () => {
    await seedStock(1);
    const o1 = await makeOrder(1);
    const o2 = await makeOrder(1);
    const results = [await pay(o1), await pay(o2)];
    expect(results.filter((r) => r === "paid")).toHaveLength(1);
    expect(results.filter((r) => r === "insufficient_stock")).toHaveLength(1);
    expect((await stock()).a).toBe(0);
  });

  it("B5: concurrent confirms of DIFFERENT orders on the same variant never lose the winner", async () => {
    await seedStock(2);
    const orders = await Promise.all([makeOrder(1), makeOrder(1), makeOrder(1)]);
    const results = await Promise.all(orders.map((o) => pay(o)));
    expect(results.filter((r) => r === "paid")).toHaveLength(2);
    expect(results.filter((r) => r === "insufficient_stock")).toHaveLength(1);
    expect((await stock()).a).toBe(0);
  });

  it("B3: concurrent confirms of the SAME order deduct once", async () => {
    await seedStock(10);
    const o = await makeOrder(4);
    const results = await Promise.all([pay(o), pay(o), pay(o)]);
    expect(results.filter((r) => r === "paid")).toHaveLength(1);
    expect(results.filter((r) => r === "already_paid")).toHaveLength(2);
    expect((await stock()).a).toBe(6);
  });
});

describe("ona_shop_restock_order (refund)", () => {
  it("B6: restocks exactly what the order took, at the same location", async () => {
    await seedStock(1, 5);
    const o = await makeOrder(3);
    expect(await pay(o)).toBe("paid");
    expect((await stock()).b).toBe(2);
    expect(await restock(o)).toBe(1);
    const s = await stock();
    expect(s).toMatchObject({ a: 1, b: 5, reserved: 0 });
  });

  it("B6: is idempotent (second call restocks nothing)", async () => {
    await seedStock(10);
    const o = await makeOrder(4);
    await pay(o);
    expect(await restock(o)).toBe(1);
    expect(await restock(o)).toBe(0);
    expect((await stock()).a).toBe(10);
  });

  it("B6: does NOT touch other orders' reservations", async () => {
    await seedStock(10);
    await db.query("update shop_inventory set qty_reserved=3 where variant_id=$1", [variantId]);
    const o = await makeOrder(2);
    await pay(o);
    await restock(o);
    expect((await stock()).reserved).toBe(3);
  });

  it("does nothing for an order that never took stock (stock-out refund path)", async () => {
    await seedStock(0);
    const o = await makeOrder(2);
    expect(await pay(o)).toBe("insufficient_stock");
    expect(await restock(o)).toBe(0);
    expect((await stock()).a).toBe(0);
  });

  it("legacy paid order (no ledger rows) is restocked once", async () => {
    await seedStock(5);
    const o = await makeOrder(2, { status: "paid" });
    await db.query("update shop_orders set paid_at=now() where id=$1", [o]);
    expect(await restock(o)).toBe(1);
    expect((await stock()).a).toBe(7);
    expect(await restock(o)).toBe(0);
    expect((await stock()).a).toBe(7);
  });

  it("legacy UNPAID order is never restocked", async () => {
    await seedStock(5);
    const o = await makeOrder(2);
    expect(await restock(o)).toBe(0);
    expect((await stock()).a).toBe(5);
  });

  it("old ona_shop_release is now a safe alias", async () => {
    await seedStock(10);
    const o = await makeOrder(2);
    await pay(o);
    await db.query("select ona_shop_release($1)", [o]);
    expect((await stock()).a).toBe(10);
    await db.query("select ona_shop_release($1)", [o]);
    expect((await stock()).a).toBe(10);
  });
});

describe("ona_shop_create_order", () => {
  const items = (v: string) => [
    {
      variant_id: v,
      product_name: "P",
      variant_title: "V",
      sku: "SKU",
      qty: 2,
      unit_price_minor: 500,
      line_total_minor: 1000,
    },
  ];
  const order = (token: string, num = "OS-1") => ({
    order_number: num,
    user_id: "",
    account_context: "motorist",
    currency: "NGN",
    subtotal_minor: 1000,
    delivery_fee_minor: 200,
    total_minor: 1200,
    ship_to_snapshot: { a: 1 },
    checkout_token: token,
    delivery_zone_code: "default",
    delivery_service_code: "standard",
    delivery_eta_minutes: 45,
    event_payload: { itemCount: 2 },
  });

  it("H1: creates order + items + event atomically", async () => {
    const res = await one<{ r: { alreadyExists: boolean; id: string; totalMinor: number } }>(
      "select ona_shop_create_order($1::jsonb,$2::jsonb) as r",
      [JSON.stringify({ ...order("t1"), user_id: userId }), JSON.stringify(items(variantId))],
    );
    expect(res.r.alreadyExists).toBe(false);
    expect(res.r.totalMinor).toBe(1200);
    const n = await one<{ i: number; e: number }>(
      `select (select count(*)::int from shop_order_items where order_id=$1) i,
              (select count(*)::int from shop_order_events where order_id=$1) e`,
      [res.r.id],
    );
    expect(n).toEqual({ i: 1, e: 1 });
  });

  it("H1: a failing item rolls back the whole order (no orphan)", async () => {
    const bad = [{ ...items(variantId)[0], variant_id: "00000000-0000-0000-0000-000000000000" }];
    await expect(
      db.query("select ona_shop_create_order($1::jsonb,$2::jsonb)", [
        JSON.stringify({ ...order("t2", "OS-2"), user_id: userId }),
        JSON.stringify(bad),
      ]),
    ).rejects.toThrow();
    expect((await one<{ n: number }>("select count(*)::int n from shop_orders")).n).toBe(0);
  });

  it("is idempotent on checkout_token and reports the existing status", async () => {
    const args = (num: string) => [
      JSON.stringify({ ...order("t3", num), user_id: userId }),
      JSON.stringify(items(variantId)),
    ];
    const first = await one<{ r: { id: string } }>(
      "select ona_shop_create_order($1::jsonb,$2::jsonb) as r",
      args("OS-3"),
    );
    const again = await one<{ r: { alreadyExists: boolean; id: string; status: string } }>(
      "select ona_shop_create_order($1::jsonb,$2::jsonb) as r",
      args("OS-3b"),
    );
    expect(again.r).toMatchObject({
      alreadyExists: true,
      id: first.r.id,
      status: "pending_payment",
    });
    expect((await one<{ n: number }>("select count(*)::int n from shop_orders")).n).toBe(1);
    expect((await one<{ n: number }>("select count(*)::int n from shop_order_items")).n).toBe(1);
  });
});

describe("shop_orders status", () => {
  it("accepts refund_pending and still rejects junk", async () => {
    const o = await makeOrder(1);
    await db.query("update shop_orders set status='refund_pending' where id=$1", [o]);
    await expect(
      db.query("update shop_orders set status='bogus' where id=$1", [o]),
    ).rejects.toThrow();
  });
});

describe("function privileges", () => {
  it("anon / authenticated cannot execute the shop RPCs", async () => {
    const r = await db.query<{ fn: string; anon: boolean; auth: boolean; svc: boolean }>(
      `select p.proname fn,
              has_function_privilege('anon', p.oid, 'execute') anon,
              has_function_privilege('authenticated', p.oid, 'execute') auth,
              has_function_privilege('service_role', p.oid, 'execute') svc
       from pg_proc p where p.proname like 'ona_shop_%'`,
    );
    expect(r.rows.length).toBeGreaterThanOrEqual(6);
    for (const row of r.rows) {
      expect(row.anon, row.fn).toBe(false);
      expect(row.auth, row.fn).toBe(false);
      expect(row.svc, row.fn).toBe(true);
    }
  });
});
