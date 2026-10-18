import {
  AdminAuthError,
  logAdminAction,
  requireAdmin,
} from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { createAdminUserHistoryReader } from "@/lib/server/admin/user-history";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createAdminIdentityReader } from "@/lib/server/identity/admin-detail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full person detail: profile + role tables + identity sync + history. */
export async function GET(
  _req: Request,
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
    await requireAdmin();
    const { id } = await ctx.params;
    const reader = createAdminIdentityReader(id);
    const shared = await reader.loadSharedProfile();
    if (!shared.ok) return apiFail(shared.message, 500);
    const profile = shared.profile;
    if (!profile) return apiFail("User not found", 404);

    const history = createAdminUserHistoryReader(id);

    const [motoristProfile, repairProProfile, jobs, bookings, payments, reviews, identity] =
      await Promise.all([
        reader.loadMotoristProfile(),
        reader.loadRepairProProfile(),
        history.loadJobs(),
        history.loadBookings(),
        history.loadPayments(),
        history.loadReviews(),
        reader.loadStatus(),
      ]);

    return apiOk({
      user: {
        ...profile,
        motorist_profiles: motoristProfile,
        repair_pro_profiles: repairProProfile,
      },
      identity,
      jobs,
      bookings,
      payments,
      reviews,
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, "auth");
    }
    return apiFail("Failed to load user", 500);
  }
}

// Keep PATCH if it existed - check original file for more methods
