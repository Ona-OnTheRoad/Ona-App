import "server-only";
/** Courier assignment / delivery status transitions for the Admin board. */

import { createServiceSupabase } from "@/lib/supabase/server";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

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

  const { data: existing } = await sb
    .from("shop_deliveries")
    .select("*")
    .eq("order_id", b.orderId)
    .maybeSingle();

  const nextStatus = b.status || existing?.status || "pending";
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

  // Mirror order status for terminal delivery states
  if (nextStatus === "out_for_delivery" || nextStatus === "in_transit") {
    await sb
      .from("shop_orders")
      .update({
        status: "out_for_delivery",
        updated_at: new Date().toISOString(),
      })
      .eq("id", b.orderId)
      .in("status", ["paid", "fulfilling", "out_for_delivery"]);
  }
  if (nextStatus === "delivered") {
    await sb
      .from("shop_orders")
      .update({
        status: "delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", b.orderId);
  }
  if (nextStatus === "assigned" || nextStatus === "picked_up") {
    await sb
      .from("shop_orders")
      .update({
        status: "fulfilling",
        updated_at: new Date().toISOString(),
      })
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

  return delivery;
}
