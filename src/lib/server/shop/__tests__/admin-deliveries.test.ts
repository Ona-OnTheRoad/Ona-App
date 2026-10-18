import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import { upsertDeliveryStatus } from "@/lib/server/shop/admin-deliveries";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

type Existing = { status?: string; events?: unknown[] } | null;

function makeSb(opts: {
  existing?: Existing;
  savedDelivery?: { id: string };
}) {
  const existing = opts.existing === undefined ? null : opts.existing;
  const savedDelivery = opts.savedDelivery ?? { id: "del-1" };

  const ordersUpdateCalls: Array<{ patch: unknown; eqCalls: unknown[][] }> = [];
  const inserts: Array<{ table: string; row: unknown }> = [];

  const sb = {
    from: vi.fn((table: string) => {
      if (table === "shop_deliveries") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: existing })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: savedDelivery, error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: savedDelivery, error: null })),
            })),
          })),
        };
      }
      if (table === "shop_orders") {
        const eqCalls: unknown[][] = [];
        return {
          update: vi.fn((patch: unknown) => {
            const chain = {
              eq: vi.fn((...args: unknown[]) => {
                eqCalls.push(args);
                ordersUpdateCalls.push({ patch, eqCalls });
                return chain;
              }),
              in: vi.fn((...args: unknown[]) => {
                eqCalls.push(args);
                ordersUpdateCalls.push({ patch, eqCalls });
                return chain;
              }),
            };
            return chain;
          }),
        };
      }
      if (table === "shop_order_events" || table === "shop_audit_logs") {
        return {
          insert: vi.fn(async (row: unknown) => {
            inserts.push({ table, row });
            return { error: null };
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return { sb, ordersUpdateCalls, inserts };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upsertDeliveryStatus", () => {
  it("inserts a new delivery row when none exists yet", async () => {
    const { sb } = makeSb({ existing: null });

    const delivery = await upsertDeliveryStatus({
      orderId: "order-1",
      status: "assigned",
      courierName: "Jane",
      actorId: "admin-1",
    });

    expect(delivery).toEqual({ id: "del-1" });
    expect(sb.from).toHaveBeenCalledWith("shop_deliveries");
  });

  it("updates the existing delivery row and appends to its events", async () => {
    makeSb({ existing: { status: "pending", events: [{ status: "pending" }] } });

    const delivery = await upsertDeliveryStatus({
      orderId: "order-1",
      status: "picked_up",
      actorId: "admin-1",
      actorLabel: "admin@ona.app",
    });

    expect(delivery).toEqual({ id: "del-1" });
  });

  it("mirrors shop_orders to out_for_delivery for in_transit", async () => {
    const { ordersUpdateCalls } = makeSb({ existing: { status: "assigned" } });

    await upsertDeliveryStatus({ orderId: "order-1", status: "in_transit" });

    const call = ordersUpdateCalls[0];
    expect(call.patch).toMatchObject({ status: "out_for_delivery" });
    expect(call.eqCalls[1]).toEqual([
      "status",
      ["paid", "fulfilling", "out_for_delivery"],
    ]);
  });

  it("mirrors shop_orders to delivered for delivered", async () => {
    const { ordersUpdateCalls } = makeSb({ existing: { status: "in_transit" } });

    await upsertDeliveryStatus({ orderId: "order-1", status: "delivered" });

    expect(ordersUpdateCalls[0].patch).toMatchObject({ status: "delivered" });
  });

  it("mirrors shop_orders to fulfilling for assigned/picked_up", async () => {
    const { ordersUpdateCalls } = makeSb({ existing: null });

    await upsertDeliveryStatus({ orderId: "order-1", status: "assigned" });

    expect(ordersUpdateCalls[0].patch).toMatchObject({ status: "fulfilling" });
    expect(ordersUpdateCalls[0].eqCalls[1]).toEqual(["status", "paid"]);
  });

  it("does not mirror shop_orders for a plain pending/failed/cancelled status", async () => {
    const { ordersUpdateCalls } = makeSb({ existing: null });

    await upsertDeliveryStatus({ orderId: "order-1", status: "failed" });

    expect(ordersUpdateCalls).toHaveLength(0);
  });

  it("records a shop_order_events and shop_audit_logs entry", async () => {
    const { inserts } = makeSb({ existing: null });

    await upsertDeliveryStatus({ orderId: "order-1", status: "assigned", actorId: "admin-1" });

    expect(inserts.map((i) => i.table)).toEqual([
      "shop_order_events",
      "shop_audit_logs",
    ]);
    expect(inserts[0].row).toMatchObject({
      order_id: "order-1",
      event_type: "delivery_update",
    });
    expect(inserts[1].row).toMatchObject({
      action: "delivery_update",
      entity_type: "shop_delivery",
      entity_id: "del-1",
    });
  });
});
