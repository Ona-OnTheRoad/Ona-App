import { NextRequest } from "next/server";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { getUserFromRequest } from "@/lib/server/auth-utils";
import {
  ProductRequestsNotMigratedError,
  recordProductRequest,
} from "@/lib/server/shop/product-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Zero-result demand intelligence.
 * POST { searchTerm, tradeKey?, vehicleContext?, notify?, location? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      searchTerm?: string;
      tradeKey?: string;
      vehicleContext?: Record<string, unknown>;
      notify?: boolean;
      location?: string;
    };
    const term = (body.searchTerm || "").trim();
    if (!term || term.length < 2) {
      return apiFail("searchTerm required", 400, "VALIDATION");
    }
    const user = await getUserFromRequest(req);
    const { id } = await recordProductRequest({
      userId: user?.id ?? null,
      tradeKey: body.tradeKey,
      searchTerm: term,
      vehicleContext: body.vehicleContext,
      location: body.location,
      notify: body.notify,
    });
    return apiOk({
      id,
      message: "Request recorded for Admin review",
    });
  } catch (e) {
    if (e instanceof ProductRequestsNotMigratedError) {
      return apiFail(e.message, 503, "SETUP_REQUIRED");
    }
    const msg = e instanceof Error ? e.message : "Request failed";
    return apiFail(msg, 500, "PRODUCT_REQUEST_ERROR");
  }
}
