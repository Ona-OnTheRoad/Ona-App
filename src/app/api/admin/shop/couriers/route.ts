import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireAdmin, AdminAuthError } from "@/lib/server/admin-auth";
import { logAdminAction } from "@/lib/server/security/admin-actions";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  listCourierProviders,
  patchCourierProvider,
  upsertCourierProvider,
} from "@/lib/server/shop/admin-couriers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: list courier providers (registry for the deliveries board). */
export async function GET() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) return apiFail(e.message, e.status || 401);
    return apiFail("Auth failed", 401);
  }
  void admin;
  if (!isSupabaseAdminConfigured())
    return apiOk({ providers: [] });
  try {
    const providers = await listCourierProviders();
    return apiOk({ providers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return apiFail(msg, 500);
  }
}

/** POST: create or update a courier provider. */
export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) return apiFail(e.message, e.status || 401);
    return apiFail("Auth failed", 401);
  }
  if (!isSupabaseAdminConfigured())
    return apiFail("Supabase not configured", 500);

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return apiFail("Provider name is required", 400);

  try {
    const result = await upsertCourierProvider({
      id: body.id ? String(body.id) : undefined,
      name,
      phone: body.phone,
      active: body.active,
      notes: body.notes,
      isDefault: body.isDefault === true,
    });
    if (result.duplicateName) {
      return apiFail("A provider with that name already exists", 400);
    }
    await logAdminAction({
      adminId: admin.session.userId,
      adminName: admin.profile.full_name || undefined,
      targetType: "courier_provider",
      targetId: body.id ? String(body.id) : String((result.provider as { id: string }).id),
      actionType: body.id ? "update-courier" : "create-courier",
    });
    return apiOk({ provider: result.provider });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return apiFail(msg, 500);
  }
}

/** PATCH: toggle active / default / quick-edit phone. */
export async function PATCH(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) return apiFail(e.message, e.status || 401);
    return apiFail("Auth failed", 401);
  }
  if (!isSupabaseAdminConfigured())
    return apiFail("Supabase not configured", 500);

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return apiFail("Missing id", 400);

  try {
    const provider = await patchCourierProvider(id, {
      active: typeof body.active === "boolean" ? body.active : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      isDefault: body.isDefault === true,
    });
    await logAdminAction({
      adminId: admin.session.userId,
      adminName: admin.profile.full_name || undefined,
      targetType: "courier_provider",
      targetId: id,
      actionType: "update-courier",
    });
    return apiOk({ provider });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return apiFail(msg, 500);
  }
}
