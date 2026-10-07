import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { PAIRING_WINDOW_MS } from "@/lib/server/pairing/pairing-engine";
import { PAIRING_ACTION_STAGES } from "@/lib/jobs/incoming-popup-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "The request just appeared on this pro's screen." Server-owned arming:
 * stamps `pairing_deadline = now + 66s` EXACTLY ONCE per offer only when a
 * deadline isn't armed yet (dispatch/create leave it NULL by design). Because
 * neither dispatch nor the surface call ever re-arms an already-set deadline,
 * the 66s timer starts at 66 on the pro's card AND the customer's ring at the
 * same instant and never rolls back to a higher number.
 *
 * Safety: the pairing sweep arms the deadline itself after
 * `SURFACE_FALLBACK_GRACE_MS` if the pro's device never surfaces (app closed),
 * so timeouts/advance keep working exactly as before.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    if (!id || !isSupabaseAdminConfigured()) {
      return apiFail("Surface check unavailable", 503);
    }

    const sb = createServiceSupabase();
    const { data, error } = await sb
      .from("service_requests")
      .select("id, job_version, pairing_stage, repair_pro_id, pairing_deadline")
      .eq("id", id)
      .maybeSingle();
    if (error) return apiFail(error.message, 500);
    if (!data) return apiFail("Request not found", 404);

    const row = data as {
      id: string;
      job_version: number;
      pairing_stage: string | null;
      repair_pro_id: string | null;
      pairing_deadline: string | null;
    };

    if (row.repair_pro_id !== auth.userId) {
      return apiFail("Not assigned to this request", 403);
    }

    const stage = row.pairing_stage ?? "";
    const nowMs = Date.now();
    const existingMs = row.pairing_deadline
      ? Date.parse(String(row.pairing_deadline))
      : Number.NaN;

    // Already armed (a prior surface won, or the sweep's fallback) → never
    // re-arm. One arm per offer = no roll-back.
    let deadline = row.pairing_deadline ? String(row.pairing_deadline) : null;
    let armed = false;

    if (PAIRING_ACTION_STAGES.has(stage) && !Number.isFinite(existingMs)) {
      deadline = new Date(nowMs + PAIRING_WINDOW_MS).toISOString();
      const { data: updatedRow, error: uErr } = await sb
        .from("service_requests")
        .update({ pairing_deadline: deadline })
        .eq("id", id)
        .eq("job_version", row.job_version)
        .eq("pairing_stage", stage)
        .is("pairing_deadline", null)
        .select("id")
        .maybeSingle();
      if (uErr) return apiFail(uErr.message, 500);
      if (!updatedRow) return apiFail("Request changed; reload and retry", 409);
      armed = true;
    }

    return apiOk({
      id: row.id,
      pairingStage: stage,
      pairingDeadline: deadline,
      armed,
      serverNow: new Date().toISOString(),
    });
  } catch (e) {
    return apiFail(e instanceof Error ? e.message : "Surface failed", 500);
  }
}
