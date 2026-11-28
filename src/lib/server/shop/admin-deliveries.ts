import "server-only";
/** Courier assignment / delivery status transitions for the Admin board. */

import { createServiceSupabase } from "@/lib/supabase/server";
import { notifyShopBuyer } from "@/lib/server/shop/shop-events";

import {
  DELIVERY_TRANSITIONS,
  isAllowedDeliveryTransition,
  type DeliveryStatus,
} from "@/lib/shop/delivery-transitions";

export { DELIVERY_TRANSITIONS, isAllowedDeliveryTransition };
export type { DeliveryStatus };

/** Order states in which a delivery can still be progressed (money captured, not refunded). */
const DELIVERABLE_ORDER_STATUSES = [
  "paid",
  "fulfilling",
  "out_for_delivery",
  "delivered",
];

const BUYER_COPY: Partial<Record<DeliveryStatus, { title: string; body: (n: string) => string }>> = {
  assigned: {
    title: "Courier assigned",
    body: (n) => `A courier has been assigned to order ${n}.`,
  },
  picked_up: {
    title: "Order picked up",
    body: (n) => `Order ${n} has been picked up.`,
  },
  in_transit: {
    title: "Order on its way",
    body: (n) => `Order ${n} is out for delivery.`,
  },
  delivered: {
    title: "Order delivered",
    body: (n) => `Order ${n} has been delivered.`,
  },
  failed: {
    title: "Delivery attempt failed",
    body: (n) => `We could not deliver order ${n}. We will contact you.`,
  },
};

export async function upsertDeliveryStatus(input: {
  orderId: string;
  status?: DeliveryStatus;
  courierName?: string | null;
  courierPhone?: string | null;
  trackingCode?: string | null;
  notes?: string | null;
  actorId?: string | null;
  actorLabel?: string | null;
}): Promise<unknown> {
  const sb = createServiceSupabase();
  const b = input;

  const { data: order } = await sb
    .from("shop_orders")
    .select("id, user_id, status, order_number")
    .eq("id", b.orderId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");
  if (!DELIVERABLE_ORDER_STATUSES.includes(String(order.status))) {
    throw new Error(
      `Order is ${order.status}; its delivery cannot be updated`,
    );
  }

  const { data: existing } = await sb
    .from("shop_deliveries")
    .select("*")
    .eq("order_id", b.orderId)
    .maybeSingle();

  const prevStatus = (existing?.status || "pending") as DeliveryStatus;
  const nextStatus = (b.status || prevStatus) as DeliveryStatus;
  if (!isAllowedDeliveryTransition(prevStatus, nextStatus)) {
    throw new Error(
      `Delivery cannot go from ${prevStatus} to ${nextStatus}`,
    );
  }
  const prevEvents = Array.isArray(existing?.events)
    ? (existing.events as unknown[])
    : [];
  const events = [
    ...prevEvents,
    {
      at: new Date().toISOString(),
      status: nextStatus,
      note: b.notes || null,
      by: b.actorLabel || b.actorId || "admin",
    },
  ];

  const patch: Record<string, unknown> = {
    status: nextStatus,
    events,
    updated_at: new Date().toISOString(),
  };
  if (b.courierName !== undefined) patch.courier_name = b.courierName;
  if (b.courierPhone !== undefined) patch.courier_phone = b.courierPhone;
  if (b.trackingCode !== undefined) patch.tracking_code = b.trackingCode;
  if (b.notes !== undefined) patch.notes = b.notes;
  if (nextStatus === "assigned") {
    patch.assigned_admin_id = b.actorId || null;
  }
  if (nextStatus === "delivered") {
    patch.delivered_at = new Date().toISOString();
  }

  let delivery;
  if (existing) {
    const { data, error } = await sb
      .from("shop_deliveries")
      .update(patch)
      .eq("order_id", b.orderId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    delivery = data;
  } else {
    const { data, error } = await sb
      .from("shop_deliveries")
      .insert({
        order_id: b.orderId,
        ...patch,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    delivery = data;
  }

  // Mirror onto the order, but only while the order is still in a state that
  // allows it (never resurrect a refunded / cancelled order).
  const now = new Date().toISOString();
  if (nextStatus === "in_transit") {
    await sb
      .from("shop_orders")
      .update({ status: "out_for_delivery", updated_at: now })
      .eq("id", b.orderId)
      .in("status", ["paid", "fulfilling", "out_for_delivery"]);
  }
  if (nextStatus === "delivered") {
    await sb
      .from("shop_orders")
      .update({ status: "delivered", updated_at: now })
      .eq("id", b.orderId)
      .in("status", ["paid", "fulfilling", "out_for_delivery"]);
  }
  if (nextStatus === "assigned" || nextStatus === "picked_up") {
    await sb
      .from("shop_orders")
      .update({ status: "fulfilling", updated_at: now })
      .eq("id", b.orderId)
      .eq("status", "paid");
  }

  await sb.from("shop_order_events").insert({
    order_id: b.orderId,
    event_type: "delivery_update",
    payload: {
      status: nextStatus,
      courierName: b.courierName,
      trackingCode: b.trackingCode,
    },
    actor_id: b.actorId || null,
  });

  await sb.from("shop_audit_logs").insert({
    actor_id: b.actorId || null,
    action: "delivery_update",
    entity_type: "shop_delivery",
    entity_id: (delivery as { id?: string } | null)?.id || null,
    payload: { orderId: b.orderId, status: nextStatus },
  });

  // Tell the buyer about meaningful progress (only when the status changed).
  const copy = BUYER_COPY[nextStatus];
  if (copy && nextStatus !== prevStatus) {
    await notifyShopBuyer({
      userId: String(order.user_id),
      orderId: b.orderId,
      title: copy.title,
      body: copy.body(String(order.order_number)),
      groupKey: `shop-delivery-${b.orderId}-${nextStatus}`,
    });
  }

  return delivery;
}
