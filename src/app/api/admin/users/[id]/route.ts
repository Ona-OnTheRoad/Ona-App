import {
  AdminAuthError,
  clientIp,
  logAdminAction,
  requireAdmin,
  requireSensitiveAction,
  userAgent,
} from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { createAdminUserHistoryReader } from "@/lib/server/admin/user-history";
import { createServiceSupabase } from "@/lib/supabase/server";
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

const STAFF_ROLES = new Set([
  "admin",
  "customer_care",
  "support",
  "senior_support",
  "operations",
  "manager",
  "super_admin",
]);

/**
 * Permanently remove a customer / repair pro.
 *
 * Never deletes history. Jobs, bookings, payments and reviews are protected by
 * foreign keys, so a user with any history cannot be hard-deleted; in that case
 * the account is anonymised (PII scrubbed, login banned) and the records are
 * kept for finance, disputes and audit.
 */
export async function DELETE(
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
    const { session } = await requireSensitiveAction("user_freeze", req);
    const { id } = await ctx.params;

    if (id === session.userId) {
      return apiFail("You cannot delete your own admin account", 400);
    }

    const supabase = createServiceSupabase();
    const { data: existing, error: lookupErr } = await supabase
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("id", id)
      .maybeSingle();
    if (lookupErr) return apiFail(lookupErr.message, 500);
    if (!existing) return apiFail("User not found", 404);
    if (STAFF_ROLES.has(String(existing.role))) {
      return apiFail(
        "Staff accounts cannot be deleted here. Remove their access from Staff instead.",
        403,
        "staff_protected",
      );
    }

    const audit = {
      sensitive: true,
      ip: clientIp(req),
      user_agent: userAgent(req),
      email: existing.email,
      role: existing.role,
      full_name: existing.full_name,
    };

    const { error: authErr } = await supabase.auth.admin.deleteUser(id);
    if (!authErr) {
      await logAdminAction(session.userId, "delete_user", id, audit);
      return apiOk({ deleted: true, anonymized: false, id });
    }

    // History blocks a hard delete: keep the records, remove the person.
    const { error: scrubErr } = await supabase
      .from("profiles")
      .update({
        full_name: "Deleted user",
        email: null,
        phone: null,
        avatar_url: null,
        city: null,
        area: null,
        is_active: false,
      })
      .eq("id", id);
    if (scrubErr) {
      await logAdminAction(session.userId, "delete_user_failed", id, {
        ...audit,
        reason: authErr.message,
        scrub_error: scrubErr.message,
      });
      return apiFail(`Could not delete user: ${scrubErr.message}`, 500);
    }

    const { error: banErr } = await supabase.auth.admin.updateUserById(id, {
      email: `deleted+${id}@deleted.invalid`,
      phone: "",
      ban_duration: "876000h",
      user_metadata: {},
    });

    await logAdminAction(session.userId, "anonymize_user", id, {
      ...audit,
      reason: authErr.message,
      login_disabled: !banErr,
    });
    return apiOk({
      deleted: true,
      anonymized: true,
      id,
      message:
        "This user has jobs, payments or other records, so the account was anonymised and disabled instead of removed.",
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, e.code || "auth");
    }
    console.error(e);
    return apiFail("Failed to delete user", 500);
  }
}
