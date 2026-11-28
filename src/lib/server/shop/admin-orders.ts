import "server-only";
/** Admin read-side for shop orders: list + full detail for the ops console. */

import { createServiceSupabase } from "@/lib/supabase/server";

export const ADMIN_ORDER_STATUS_FILTERS = [
  "pending_payment",
  "paid",
  "fulfilling",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
  "refund_pending",
] as const;

/** Escape characters that are special in a PostgREST `or`/`ilike` filter value. */
export function sanitizeSearch(q: string): string {
  return q.replace(/[%_,()*\\]/g, " ").trim().slice(0, 60);
}

/**
 * Orders for the ops console. Keeps the original list shape (order columns +
 * `delivery`) and adds `buyer` and a count of refunds that need manual action.
 */
export async function listAdminOrders(opts: {
  status?: string | null;
  q?: string | null;
  limit?: number;
}) {
  const sb = createServiceSupabase();
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);

  let query = sb
    .from("shop_orders")
    .select(
      "id, order_number, user_id, status, total_minor, currency, created_at, paid_at, ship_to_snapshot, refund_error, account_context",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  // Unknown status values are ignored rather than returning an empty list.
  if (opts.status && (ADMIN_ORDER_STATUS_FILTERS as readonly string[]).includes(opts.status)) {
    query = query.eq("status", opts.status);
  }
  const term = opts.q ? sanitizeSearch(opts.q) : "";
  if (term) query = query.ilike("order_number", `%${term}%`);

  const { data: rows, error } = await query;
  if (error) throw error;
  const orders = rows ?? [];

  const userIds = [...new Set(orders.map((o) => String(o.user_id)))];
  const orderIds = orders.map((o) => String(o.id));
  const [profilesRes, deliveriesRes, attention] = await Promise.all([
    userIds.length
      ? sb.from("profiles").select("id, full_name, phone").in("id", userIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    orderIds.length
      ? sb.from("shop_deliveries").select("*").in("order_id", orderIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    sb
      .from("shop_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "refund_pending"),
  ]);
  const profileById = new Map((profilesRes.data ?? []).map((p) => [String(p.id), p]));
  const deliveryByOrder = new Map(
    (deliveriesRes.data ?? []).map((d) => [String(d.order_id), d]),
  );

  return {
    needsAttention: attention.count ?? 0,
    orders: orders.map((o) => ({
      ...o,
      buyer: profileById.get(String(o.user_id)) ?? null,
      delivery: deliveryByOrder.get(String(o.id)) ?? null,
    })),
  };
}

export async function getAdminOrderDetail(orderId: string) {
  const sb = createServiceSupabase();
  const { data: order } = await sb
    .from("shop_orders")
    .select(
      "id, order_number, status, currency, subtotal_minor, delivery_fee_minor, total_minor, ship_to_snapshot, notes, paid_at, cancelled_at, refunded_at, refund_error, created_at, user_id, account_context",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const [items, payments, delivery, events, profile] = await Promise.all([
    sb
      .from("shop_order_items")
      .select("id, product_name, variant_title, sku, qty, unit_price_minor, line_total_minor")
      .eq("order_id", orderId),
    sb
      .from("shop_payments")
      .select("id, provider, provider_ref, amount_minor, status, paid_at, refunded_at, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    sb
      .from("shop_deliveries")
      .select("status, courier_name, courier_phone, tracking_code, zone_name, service_code, eta_minutes, notes, delivered_at, updated_at")
      .eq("order_id", orderId)
      .maybeSingle(),
    sb
      .from("shop_order_events")
      .select("id, event_type, payload, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    sb
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", order.user_id)
      .maybeSingle(),
  ]);

  return {
    order,
    buyer: profile.data ?? null,
    items: items.data ?? [],
    payments: payments.data ?? [],
    delivery: delivery.data ?? null,
    events: events.data ?? [],
  };
}
