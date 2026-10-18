import { z } from "zod";
import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { upsertDeliveryStatus } from "@/lib/server/shop/admin-deliveries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  status: z
    .enum([
      "pending",
      "assigned",
      "picked_up",
      "in_transit",
      "delivered",
      "failed",
      "cancelled",
    ])
    .optional(),
  courierName: z.string().max(120).optional().nullable(),
  courierPhone: z.string().max(40).optional().nullable(),
  trackingCode: z.string().max(80).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

/** Assign courier / update shop delivery status. */
export async function PATCH(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail(
      "Supabase is not configured",
      503,
      "supabase_not_configured",
    );
  }
  try {
    const { session } = await requireAdmin();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return apiFail("Invalid body", 400, "invalid_body");

    const delivery = await upsertDeliveryStatus({
      ...parsed.data,
      actorId: session?.userId || null,
      actorLabel: session?.email || null,
    });

    return apiOk({ delivery });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, "admin_auth");
    }
    const msg = e instanceof Error ? e.message : "Failed";
    return apiFail(msg, 500);
  }
}
