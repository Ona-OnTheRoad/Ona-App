import { NextRequest } from "next/server";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { cancelUnpaidOrder } from "@/lib/server/shop/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Buyer cancels their own UNPAID order (no money or stock has moved yet). */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;
    await cancelUnpaidOrder({ orderId: id, userId: auth.userId });
    return apiOk({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "Order not found") return apiFail(msg, 404, "not_found");
    if (/unpaid|no longer be cancelled/i.test(msg)) {
      return apiFail(msg, 409, "not_cancellable");
    }
    console.error("[shop/orders/cancel] failed:", e);
    return apiFail("Could not cancel the order", 500, "SHOP_CANCEL_ERROR");
  }
}
