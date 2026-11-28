import { z } from "zod";
import {
  AdminAuthError,
  requireAdmin,
  requirePermission,
} from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { getAdminOrderDetail } from "@/lib/server/shop/admin-orders";
import {
  cancelUnpaidOrder,
  REFUNDABLE_ORDER_STATUSES,
  refundShopOrder,
} from "@/lib/server/shop/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full order detail for the ops console. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Supabase is not configured", 503, "supabase_not_configured");
  }
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const detail = await getAdminOrderDetail(id);
    if (!detail) return apiFail("Order not found", 404, "not_found");
    return apiOk(detail);
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, "admin_auth");
    }
    console.error("[admin/shop/orders] detail failed:", e);
    return apiFail("Could not load order", 500, "SHOP_ADMIN_ORDER_ERROR");
  }
}

const bodySchema = z.object({
  action: z.enum(["cancel", "refund"]),
  reason: z.string().max(300).optional().nullable(),
});

/** Admin order actions: cancel an unpaid order or refund a paid one. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail(
      "Supabase is not configured",
      503,
      "supabase_not_configured",
    );
  }
  try {
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiFail("Invalid body", 400, "invalid_body");

    // Refunds move money: they need the finance-level "escrow_refund"
    // permission, not just any admin session.
    const { session } =
      parsed.data.action === "refund"
        ? await requirePermission("escrow_refund")
        : await requireAdmin();

    const sb = createServiceSupabase();
    const { data: order } = await sb
      .from("shop_orders")
      .select("id, user_id, status")
      .eq("id", id)
      .maybeSingle();
    if (!order) return apiFail("Order not found", 404, "not_found");

    const actorId = session?.userId || null;

    if (parsed.data.action === "cancel") {
      if (order.status !== "pending_payment") {
        return apiFail(
          `Only unpaid orders can be cancelled (status: ${order.status})`,
          400,
          "invalid_status",
        );
      }
      await cancelUnpaidOrder({
        orderId: id,
        userId: String(order.user_id),
        actorId,
        reason: parsed.data.reason || "admin_cancel",
      });
      return apiOk({ ok: true, action: "cancel" });
    }

    // refund
    if (!REFUNDABLE_ORDER_STATUSES.includes(String(order.status))) {
      return apiFail(
        `Only paid orders can be refunded (status: ${order.status})`,
        400,
        "invalid_status",
      );
    }
    await refundShopOrder({
      orderId: id,
      actorId,
      reason: parsed.data.reason || "admin_refund",
    });
    return apiOk({ ok: true, action: "refund" });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, "admin_auth");
    }
    const msg = e instanceof Error ? e.message : "Order action failed";
    return apiFail(msg, 400, "SHOP_ADMIN_ORDER_ACTION_ERROR");
  }
}
