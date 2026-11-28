import "server-only";
/**
 * Housekeeping for the shop:
 *  1. Re-check pending payments the customer never came back to confirm
 *     (closed tab, lost redirect, missed webhook), so paid orders are never
 *     left unfulfilled.
 *  2. Cancel unpaid orders that have gone stale, so they do not pile up.
 */

import { createServiceSupabase } from "@/lib/supabase/server";
import { cancelUnpaidOrder } from "@/lib/server/shop/orders";
import { verifyShopPayment } from "@/lib/server/shop/payments";

export const RECONCILE_MIN_AGE_MS = 3 * 60 * 1000;
export const RECONCILE_MAX_AGE_MS = 72 * 60 * 60 * 1000;
export const STALE_ORDER_AGE_MS = 24 * 60 * 60 * 1000;

export type ShopSweepResult = {
  reconciled: number;
  confirmed: number;
  stillPending: number;
  errors: number;
  cancelled: number;
};

export async function runShopSweep(now = Date.now()): Promise<ShopSweepResult> {
  const sb = createServiceSupabase();
  const result: ShopSweepResult = {
    reconciled: 0,
    confirmed: 0,
    stillPending: 0,
    errors: 0,
    cancelled: 0,
  };

  const { data: pending } = await sb
    .from("shop_payments")
    .select("provider_ref, created_at")
    .eq("status", "pending")
    .lte("created_at", new Date(now - RECONCILE_MIN_AGE_MS).toISOString())
    .gte("created_at", new Date(now - RECONCILE_MAX_AGE_MS).toISOString())
    .order("created_at", { ascending: true })
    .limit(50);

  for (const p of pending ?? []) {
    if (!p.provider_ref) continue;
    result.reconciled++;
    try {
      const r = await verifyShopPayment({ reference: String(p.provider_ref) });
      if (r.success || r.refunded || r.refundPending) result.confirmed++;
      else result.stillPending++;
    } catch (e) {
      result.errors++;
      console.warn("[shop-sweep] verify failed", p.provider_ref, e);
    }
  }

  const { data: stale } = await sb
    .from("shop_orders")
    .select("id, user_id")
    .eq("status", "pending_payment")
    .lte("created_at", new Date(now - STALE_ORDER_AGE_MS).toISOString())
    .limit(100);

  for (const o of stale ?? []) {
    try {
      await cancelUnpaidOrder({
        orderId: String(o.id),
        userId: String(o.user_id),
        reason: "stale_unpaid",
      });
      result.cancelled++;
    } catch {
      /* paid or cancelled in the meantime: fine */
    }
  }

  return result;
}
