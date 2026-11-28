import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

const notifyMock = vi.fn(async () => undefined);
vi.mock("@/lib/server/shop/shop-events", () => ({
  notifyShopBuyer: (...args: unknown[]) => (notifyMock as (...a: unknown[]) => unknown)(...args),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  isAllowedDeliveryTransition,
  upsertDeliveryStatus,
} from "@/lib/server/shop/admin-deliveries";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

type Existing = { status?: string; events?: unknown[] } | null;

function makeSb(opts: {
  existing?: Existing;
  savedDelivery?: { id: string };
  orderStatus?: string | null;
}) {
  const orderRow =
    opts.orderStatus === null
      ? null
      : {
          id: "order-1",
          user_id: "user-1",
          order_number: "OS-1",
          status: opts.orderStatus ?? "paid",
        };
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
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: orderRow })),
            })),
          })),
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
  notifyMock.mockClear();
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
    makeSb({ existing: { status: "assigned", events: [{ status: "assigned" }] } });

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
    // H4: never resurrect a refunded/cancelled order
    expect(ordersUpdateCalls[0].eqCalls[1]).toEqual([
      "status",
      ["paid", "fulfilling", "out_for_delivery"],
    ]);
  });

  it("mirrors shop_orders to fulfilling for assigned/picked_up", async () => {
    const { ordersUpdateCalls } = makeSb({ existing: null });

    await upsertDeliveryStatus({ orderId: "order-1", status: "assigned" });

    expect(ordersUpdateCalls[0].patch).toMatchObject({ status: "fulfilling" });
    expect(ordersUpdateCalls[0].eqCalls[1]).toEqual(["status", "paid"]);
  });

  it("does not mirror shop_orders for a plain pending/failed/cancelled status", async () => {
    const { ordersUpdateCalls } = makeSb({ existing: { status: "assigned" } });

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

  it("H4: rejects moving a delivered delivery back to pending", async () => {
    makeSb({ existing: { status: "delivered" } });
    await expect(
      upsertDeliveryStatus({ orderId: "order-1", status: "pending" }),
    ).rejects.toThrow(/cannot go from delivered to pending/);
  });

  it("H4: rejects skipping straight from pending to delivered", async () => {
    makeSb({ existing: { status: "pending" } });
    await expect(
      upsertDeliveryStatus({ orderId: "order-1", status: "delivered" }),
    ).rejects.toThrow(/cannot go from pending to delivered/);
  });

  it("H4: refuses to touch the delivery of a refunded or cancelled order", async () => {
    for (const status of ["refunded", "cancelled", "pending_payment", "refund_pending"]) {
      const { ordersUpdateCalls } = makeSb({ existing: { status: "in_transit" }, orderStatus: status });
      await expect(
        upsertDeliveryStatus({ orderId: "order-1", status: "delivered" }),
      ).rejects.toThrow(/cannot be updated/);
      expect(ordersUpdateCalls).toHaveLength(0);
    }
  });

  it("rejects an unknown order", async () => {
    makeSb({ existing: null, orderStatus: null });
    await expect(
      upsertDeliveryStatus({ orderId: "order-1", status: "assigned" }),
    ).rejects.toThrow("Order not found");
  });

  it("allows same-status edits (e.g. changing the courier on an assigned delivery)", async () => {
    makeSb({ existing: { status: "assigned" } });
    await expect(
      upsertDeliveryStatus({ orderId: "order-1", status: "assigned", courierName: "New" }),
    ).resolves.toEqual({ id: "del-1" });
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("H5: tells the buyer when the status actually changes", async () => {
    makeSb({ existing: { status: "assigned" } });
    await upsertDeliveryStatus({ orderId: "order-1", status: "in_transit" });
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        orderId: "order-1",
        title: "Order on its way",
        groupKey: "shop-delivery-order-1-in_transit",
      }),
    );
  });
});

describe("isAllowedDeliveryTransition", () => {
  it("encodes the happy path and blocks regressions", () => {
    expect(isAllowedDeliveryTransition("pending", "assigned")).toBe(true);
    expect(isAllowedDeliveryTransition("assigned", "picked_up")).toBe(true);
    expect(isAllowedDeliveryTransition("picked_up", "in_transit")).toBe(true);
    expect(isAllowedDeliveryTransition("in_transit", "delivered")).toBe(true);
    expect(isAllowedDeliveryTransition("failed", "assigned")).toBe(true);
    expect(isAllowedDeliveryTransition("delivered", "in_transit")).toBe(false);
    expect(isAllowedDeliveryTransition("cancelled", "assigned")).toBe(false);
    expect(isAllowedDeliveryTransition("in_transit", "pending")).toBe(false);
  });
});
