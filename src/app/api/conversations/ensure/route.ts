import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  requestId: z.string().min(1),
});

/**
 * Create (or return the existing) conversation for a service request.
 * Takes only requestId from the client -- motorist_id/repair_pro_id come
 * from the service_requests row itself, never from client input, since
 * trusting client-supplied party ids here would let a caller attach an
 * arbitrary conversation to someone else's request.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiFail("Invalid body", 400);
  const { requestId } = parsed.data;

  try {
    const sb = createServiceSupabase();

    const { data: job, error: jobError } = await sb
      .from("service_requests")
      .select("id, motorist_id, repair_pro_id")
      .eq("id", requestId)
      .maybeSingle();
    if (jobError) return apiFail(jobError.message, 500);
    if (!job) return apiFail("Request not found", 404);

    const motoristId = String(job.motorist_id || "");
    const repairProId = job.repair_pro_id ? String(job.repair_pro_id) : "";
    if (auth.userId !== motoristId && auth.userId !== repairProId) {
      return apiFail("Forbidden", 403, "forbidden");
    }
    if (!repairProId) {
      return apiFail("Request has no repair pro assigned yet", 400);
    }

    const { data: existing, error: existingError } = await sb
      .from("conversations")
      .select("id")
      .eq("request_id", requestId)
      .maybeSingle();
    if (existingError) return apiFail(existingError.message, 500);
    if (existing?.id) {
      return apiOk({ conversationId: existing.id as string });
    }

    const { data, error } = await sb
      .from("conversations")
      .insert({
        request_id: requestId,
        motorist_id: motoristId,
        repair_pro_id: repairProId,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !data) {
      return apiFail(error?.message || "Chat create failed", 500);
    }

    return apiOk({ conversationId: data.id as string });
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Could not create conversation",
      500,
    );
  }
}
