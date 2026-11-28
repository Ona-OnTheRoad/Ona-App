import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { listAdminOrders } from "@/lib/server/shop/admin-orders";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List shop orders + delivery status for admin control. */
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail(
      "Supabase is not configured",
      503,
      "supabase_not_configured",
    );
  }
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

    try {
      const result = await listAdminOrders({
        status: url.searchParams.get("status"),
        q: url.searchParams.get("q"),
        limit: Number.isFinite(limit) ? limit : 50,
      });
      return apiOk({ ...result, setupRequired: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? "");
      if (/does not exist|Could not find the table/i.test(message)) {
        return apiOk({
          orders: [],
          setupRequired: true,
          message: "Apply migration 20260809_050_ona_shop_core.sql",
        });
      }
      throw error;
    }
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, "admin_auth");
    }
    const msg = e instanceof Error ? e.message : "Failed";
    return apiFail(msg, 500);
  }
}
