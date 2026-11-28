import "server-only";
/**
 * Shop order engine: atomic create, atomic pay (stock + status + delivery in
 * ONE database transaction), real refunds.
 *
 * Idempotency: a server-generated checkout_token makes one checkout create at
 * most one *payable* order (double-click / retry safe). A token that already
 * belongs to a finished (cancelled / refunded / paid) order is never reused.
 * Stock: all stock movement happens inside Postgres functions
 * (`ona_shop_pay_order`, `ona_shop_restock_order`) which lock rows, so it is
 * safe under concurrency and can never oversell.
 * Delivery fee: always supplied by the delivery engine (never the client).
 */

import { createHash } from "node:crypto";
import { createServiceSupabase } from "@/lib/supabase/server";
import { loadCart, validateCartForCheckout } from "@/lib/server/shop/cart";
import { refundAtGateway } from "@/lib/server/shop/refund";
import { auditShop, notifyShopBuyer } from "@/lib/server/shop/shop-events";
import type {
  ShopAccountContext,
  ShopOrderStatus,
} from "@/lib/server/shop/types";

/** Order states an admin may refund (money has been captured). */
export const REFUNDABLE_ORDER_STATUSES: readonly string[] = [
  "paid",
  "fulfilling",
  "out_for_delivery",
  "refund_pending",
];

function orderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `OS-${t}-${r}`;
}

export type DeliveryFeeEstimate = {
  deliveryFeeMinor: number;
  zoneCode: string;
  zoneName: string;
  serviceCode: string;
  etaMinutesMin: number;
  etaMinutesMax: number;
};

/**
 * Idempotency token. Everything that changes what the buyer would pay or where
 * it goes is part of it, so a changed address / zone / price / quantity can
 * never silently re-use a stale order.
 */
export function buildCheckoutToken(input: {
  cartId: string;
  items: Array<{ variantId: string; qty: number; unitPriceMinor: number }>;
  addressId: string;
  zoneCode: string;
  deliveryFeeMinor: number;
  subtotalMinor: number;
}): string {
  const sig = [
    ...input.items
      .map((i) => `${i.variantId}:${i.qty}:${i.unitPriceMinor}`)
      .sort(),
    `addr:${input.addressId}`,
    `zone:${input.zoneCode}`,
    `fee:${input.deliveryFeeMinor}`,
    `sub:${input.subtotalMinor}`,
  ].join("|");
  return `cart:${input.cartId}:${createHash("sha256")
    .update(sig)
    .digest("hex")
    .slice(0, 24)}`;
}

export type CreateOrderInput = {
  userId: string;
  accountContext: ShopAccountContext;
  cartId: string;
  /** Idempotency key: a duplicate token returns the existing PAYABLE order. */
  checkoutToken: string;
  shipToAddressId?: string | null;
  shipToSnapshot?: Record<string, unknown>;
  delivery: DeliveryFeeEstimate;
  notes?: string;
};

export type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  totalMinor: number;
  alreadyExists: boolean;
};

type CreateOrderRpc = {
  alreadyExists: boolean;
  id: string;
  orderNumber: string;
  totalMinor: number | string;
  status: string;
};

function isOrderNumberCollision(message: string): boolean {
  return /order_number/i.test(message) && /duplicate|unique/i.test(message);
}

export async function createOrderFromCart(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const sb = createServiceSupabase();

  // Idempotency: re-use an order already created for this token, but only
  // while it is still payable. A finished order's token is never reused.
  let token = input.checkoutToken;
  const { data: existing } = await sb
    .from("shop_orders")
    .select("id, order_number, total_minor, status")
    .eq("checkout_token", token)
    .maybeSingle();
  if (existing) {
    if (existing.status === "pending_payment") {
      return {
        orderId: String(existing.id),
        orderNumber: String(existing.order_number),
        totalMinor: Number(existing.total_minor),
        alreadyExists: true,
      };
    }
    token = `${token}:${Date.now().toString(36)}`;
  }

  const cart = await loadCart(input.cartId);
  if (cart.userId !== input.userId) throw new Error("Forbidden");
  const v = validateCartForCheckout(cart);
  if (!v.ok) throw new Error(v.errors.join("; "));

  const deliveryFee = Math.max(0, input.delivery.deliveryFeeMinor ?? 0);
  const total = cart.subtotalMinor + deliveryFee;

  const items = cart.items.map((line) => ({
    variant_id: line.variantId,
    product_name: line.productName,
    variant_title: line.variantTitle,
    sku: line.sku,
    qty: line.qty,
    unit_price_minor: line.unitPriceMinor,
    line_total_minor: line.lineTotalMinor,
  }));

  let lastError = "Order create failed";
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await sb.rpc("ona_shop_create_order", {
      p_order: {
        order_number: orderNumber(),
        user_id: input.userId,
        account_context: input.accountContext,
        currency: cart.currency || "NGN",
        subtotal_minor: cart.subtotalMinor,
        delivery_fee_minor: deliveryFee,
        total_minor: total,
        ship_to_address_id: input.shipToAddressId || null,
        ship_to_snapshot: input.shipToSnapshot || {},
        notes: input.notes || null,
        checkout_token: token,
        delivery_zone_code: input.delivery.zoneCode,
        delivery_service_code: input.delivery.serviceCode,
        delivery_eta_minutes:
          Math.round(
            (input.delivery.etaMinutesMin + input.delivery.etaMinutesMax) / 2,
          ) || null,
        event_payload: { cartId: cart.id, itemCount: cart.itemCount },
      },
      p_items: items,
    });
    if (error) {
      lastError = error.message;
      if (isOrderNumberCollision(error.message)) continue;
      throw new Error(error.message);
    }
    const res = data as CreateOrderRpc | null;
    if (!res) throw new Error("Order create failed");
    if (res.alreadyExists && res.status !== "pending_payment") {
      // Lost a race against a terminal order with this exact token.
      throw new Error("Checkout was already completed. Please refresh.");
    }
    return {
      orderId: String(res.id),
      orderNumber: String(res.orderNumber),
      totalMinor: Number(res.totalMinor),
      alreadyExists: Boolean(res.alreadyExists),
    };
  }
  throw new Error(lastError);
}

export type PayOrderOutcome =
  | "paid"
  | "already_paid"
  | "insufficient_stock"
  | "invalid_status"
  | "not_found";

/**
 * Payment confirmed -> ONE atomic database step: lock the order, take stock
 * (all lines or nothing), mark paid, open the delivery row. Safe to call any
 * number of times, from any number of workers: only the first call does work.
 */
export async function markShopOrderPaid(opts: {
  orderId: string;
  paymentId: string;
}): Promise<PayOrderOutcome> {
  const sb = createServiceSupabase();
  const { data, error } = await sb.rpc("ona_shop_pay_order", {
    p_order_id: opts.orderId,
    p_payment_id: opts.paymentId,
  });
  if (error) throw new Error(error.message);
  const outcome = String(data) as PayOrderOutcome;

  if (outcome === "paid") {
    await afterOrderPaid(opts.orderId);
  }
  return outcome;
}

/** Best-effort follow-ups that must never undo a successful payment. */
async function afterOrderPaid(orderId: string): Promise<void> {
  const sb = createServiceSupabase();
  const { data: order } = await sb
    .from("shop_orders")
    .select("user_id, account_context, order_number")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  try {
    // Remove only what was bought. Anything the buyer added since stays.
    const { data: bought } = await sb
      .from("shop_order_items")
      .select("variant_id")
      .eq("order_id", orderId);
    const variantIds = (bought ?? []).map((b) => String(b.variant_id));
    const { data: openCart } = await sb
      .from("shop_carts")
      .select("id")
      .eq("user_id", order.user_id)
      .eq("account_context", order.account_context)
      .eq("status", "open")
      .maybeSingle();
    if (openCart && variantIds.length) {
      await sb
        .from("shop_cart_items")
        .delete()
        .eq("cart_id", openCart.id)
        .in("variant_id", variantIds);
      const { count } = await sb
        .from("shop_cart_items")
        .select("id", { count: "exact", head: true })
        .eq("cart_id", openCart.id);
      if (!count) {
        await sb
          .from("shop_carts")
          .update({ status: "converted", updated_at: new Date().toISOString() })
          .eq("id", openCart.id);
      }
    }
  } catch (e) {
    console.warn("[shop] cart cleanup after payment failed", orderId, e);
  }

  await notifyShopBuyer({
    userId: String(order.user_id),
    orderId,
    title: "Shop order paid",
    body: `Order ${order.order_number} is confirmed.`,
    groupKey: `shop-paid-${orderId}`,
  });
}

/**
 * Cancel an unpaid order: voids any pending payment row. Only valid while the
 * order is `pending_payment` (no stock has been taken yet).
 */
export async function cancelUnpaidOrder(opts: {
  orderId: string;
  userId: string;
  actorId?: string | null;
  reason?: string;
}): Promise<void> {
  const sb = createServiceSupabase();
  const { data: order } = await sb
    .from("shop_orders")
    .select("id, user_id, status, order_number")
    .eq("id", opts.orderId)
    .eq("user_id", opts.userId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending_payment") {
    throw new Error("Only unpaid orders can be cancelled");
  }

  // Conditional update: if a payment lands between the read and now, the
  // order is no longer pending and nothing is cancelled.
  const { data: cancelled, error } = await sb
    .from("shop_orders")
    .update({
      status: "cancelled" satisfies ShopOrderStatus,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.orderId)
    .eq("status", "pending_payment")
    .select("id");
  if (error) throw new Error(error.message);
  if (!cancelled?.length) {
    throw new Error("Order can no longer be cancelled (it may have just been paid)");
  }

  await sb
    .from("shop_payments")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("order_id", opts.orderId)
    .eq("status", "pending");

  await sb.from("shop_order_events").insert({
    order_id: opts.orderId,
    event_type: "cancelled",
    payload: { reason: opts.reason ?? "buyer_cancel_unpaid" },
    actor_id: opts.actorId ?? opts.userId,
  });

  await auditShop({
    actorId: opts.actorId ?? opts.userId,
    action: "order_cancel",
    entityType: "shop_order",
    entityId: opts.orderId,
    payload: { reason: opts.reason ?? "buyer_cancel_unpaid" },
  });

  await notifyShopBuyer({
    userId: String(order.user_id),
    orderId: opts.orderId,
    title: "Shop order cancelled",
    body: `Order ${order.order_number} was cancelled.`,
    groupKey: `shop-cancelled-${opts.orderId}`,
  });
}

export type RefundOutcome = { refunded: true } | { refunded: false; message: string };

/**
 * Money back + stock back. Records "refunded" ONLY after the gateway accepted
 * the refund. If the gateway refuses, the order moves to `refund_pending`
 * with the reason so ops can see it and retry.
 */
export async function refundCapturedPayment(opts: {
  orderId: string;
  actorId?: string | null;
  reason: string;
}): Promise<RefundOutcome> {
  const sb = createServiceSupabase();
  const { data: order } = await sb
    .from("shop_orders")
    .select("id, user_id, status, order_number")
    .eq("id", opts.orderId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");

  const { data: payment } = await sb
    .from("shop_payments")
    .select("id, provider, provider_ref, status")
    .eq("order_id", opts.orderId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let message: string | null = null;
  if (!payment || !payment.provider_ref) {
    message = "No successful payment found to refund";
  } else {
    const gw = await refundAtGateway({
      provider: String(payment.provider),
      providerRef: String(payment.provider_ref),
      reason: `Ona shop order ${order.order_number}: ${opts.reason}`,
    });
    if (!gw.ok) message = gw.message;
  }

  if (message || !payment) {
    await sb
      .from("shop_orders")
      .update({
        status: "refund_pending" satisfies ShopOrderStatus,
        refund_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opts.orderId);
    await sb.from("shop_order_events").insert({
      order_id: opts.orderId,
      event_type: "refund_failed",
      payload: { reason: opts.reason, error: message },
      actor_id: opts.actorId ?? null,
    });
    await auditShop({
      actorId: opts.actorId,
      action: "order_refund_failed",
      entityType: "shop_order",
      entityId: opts.orderId,
      payload: { reason: opts.reason, error: message },
    });
    console.error("[shop] REFUND FAILED - needs manual action", opts.orderId, message);
    return { refunded: false, message: message ?? "Refund failed" };
  }

  // Gateway has returned the money. Put stock back (idempotent, exact).
  let restockError: string | null = null;
  try {
    const { error } = await sb.rpc("ona_shop_restock_order", {
      p_order_id: opts.orderId,
    });
    if (error) restockError = error.message;
  } catch (e) {
    restockError = e instanceof Error ? e.message : "restock failed";
  }
  if (restockError) {
    console.error("[shop] restock failed AFTER refund", opts.orderId, restockError);
  }

  const now = new Date().toISOString();
  await sb
    .from("shop_orders")
    .update({
      status: "refunded" satisfies ShopOrderStatus,
      refunded_at: now,
      refund_error: null,
      updated_at: now,
    })
    .eq("id", opts.orderId);
  await sb
    .from("shop_payments")
    .update({ status: "refunded", refunded_at: now, updated_at: now })
    .eq("id", payment.id);
  await sb
    .from("shop_deliveries")
    .update({ status: "cancelled", updated_at: now })
    .eq("order_id", opts.orderId);
  await sb.from("shop_order_events").insert({
    order_id: opts.orderId,
    event_type: "refunded",
    payload: {
      reason: opts.reason,
      ...(restockError ? { restockError } : {}),
    },
    actor_id: opts.actorId ?? null,
  });
  await auditShop({
    actorId: opts.actorId,
    action: "order_refund",
    entityType: "shop_order",
    entityId: opts.orderId,
    payload: { reason: opts.reason, restockError },
  });
  await notifyShopBuyer({
    userId: String(order.user_id),
    orderId: opts.orderId,
    title: "Shop order refunded",
    body: `Order ${order.order_number} was refunded to your original payment method.`,
    groupKey: `shop-refunded-${opts.orderId}`,
  });
  return { refunded: true };
}

/** Admin/ops refund of a paid order. Throws if the gateway refuses. */
export async function refundShopOrder(opts: {
  orderId: string;
  actorId?: string | null;
  reason?: string;
}): Promise<void> {
  const sb = createServiceSupabase();
  const { data: order } = await sb
    .from("shop_orders")
    .select("status")
    .eq("id", opts.orderId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");
  if (!REFUNDABLE_ORDER_STATUSES.includes(String(order.status))) {
    throw new Error("Only paid orders can be refunded");
  }
  const res = await refundCapturedPayment({
    orderId: opts.orderId,
    actorId: opts.actorId,
    reason: opts.reason ?? "admin_refund",
  });
  if (!res.refunded) {
    throw new Error(
      `Gateway did not complete the refund: ${res.message}. The order is marked "refund pending" - fix the cause and retry.`,
    );
  }
}

export async function getUserOrders(
  userId: string,
  accountContext: ShopAccountContext = "motorist",
  limit = 30,
) {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("shop_orders")
    .select(
      "id, order_number, status, total_minor, currency, created_at, paid_at",
    )
    .eq("user_id", userId)
    .eq("account_context", accountContext)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrderForUser(
  orderId: string,
  userId: string,
  accountContext: ShopAccountContext = "motorist",
) {
  const sb = createServiceSupabase();
  const { data: order, error } = await sb
    .from("shop_orders")
    .select(
      "id, order_number, status, currency, subtotal_minor, delivery_fee_minor, discount_minor, total_minor, ship_to_snapshot, notes, paid_at, cancelled_at, refunded_at, created_at, updated_at",
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("account_context", accountContext)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;
  const { data: items } = await sb
    .from("shop_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  const { data: delivery } = await sb
    .from("shop_deliveries")
    .select(
      "status, courier_name, courier_phone, tracking_code, zone_name, service_code, eta_minutes, delivered_at, updated_at",
    )
    .eq("order_id", orderId)
    .maybeSingle();
  // Never send raw provider payloads (raw_init / raw_verify) to the client.
  const { data: payments } = await sb
    .from("shop_payments")
    .select("id, provider, provider_ref, amount_minor, currency, status, paid_at, refunded_at, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  const { data: events } = await sb
    .from("shop_order_events")
    .select("id, event_type, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  return {
    order,
    items: items ?? [],
    delivery,
    payments: payments ?? [],
    events: events ?? [],
  };
}
