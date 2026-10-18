import { NextRequest } from "next/server";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { getShopDemandAnalytics } from "@/lib/server/shop/admin-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mechanic Shop demand analytics for Admin. */
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const analytics = await getShopDemandAnalytics();
    return apiOk(analytics);
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, "auth");
    }
    const msg = e instanceof Error ? e.message : "Analytics failed";
    if (/relation .* does not exist|Could not find the table/i.test(msg)) {
      return apiOk({
        setupRequired: true,
        message: "Run migration 061 for listings/requests analytics",
        topZeroResult: [],
        openProductRequests: [],
        listingCounts: {},
      });
    }
    return apiFail(msg, 500, "SHOP_ANALYTICS");
  }
}
