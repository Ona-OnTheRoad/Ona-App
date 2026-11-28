import "server-only";
/** Best-effort buyer notifications + admin audit rows for shop actions. */

import { createServiceSupabase } from "@/lib/supabase/server";

export async function notifyShopBuyer(opts: {
  userId: string;
  orderId: string;
  title: string;
  body: string;
  /** Must be unique per event so the notification de-dupe doesn't swallow it. */
  groupKey: string;
}): Promise<void> {
  try {
    const { insertNotification } = await import("@/lib/server/notifications");
    await insertNotification({
      userId: opts.userId,
      category: "payments",
      title: opts.title,
      body: opts.body,
      href: `/shop/orders/${opts.orderId}`,
      groupKey: opts.groupKey,
    });
  } catch {
    /* notifications are optional; never fail the money/stock path */
  }
}

export async function auditShop(opts: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const sb = createServiceSupabase();
    const { error } = await sb.from("shop_audit_logs").insert({
      actor_id: opts.actorId ?? null,
      action: opts.action,
      entity_type: opts.entityType,
      entity_id: opts.entityId ?? null,
      payload: opts.payload ?? {},
    });
    if (error) console.warn("[shop] audit insert failed:", error.message);
  } catch (e) {
    console.warn("[shop] audit insert threw:", e);
  }
}
