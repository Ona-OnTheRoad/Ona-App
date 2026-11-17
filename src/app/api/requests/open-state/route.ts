import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Single source of truth for the app-wide one-open-request rule:
 * hasOpen = the customer has an in-flight request (any trade), plus their
 * unpaid Ona Express draft (if any) for resume.
 */
const OPEN_STATUSES = [
  "draft",
  "requested",
  "matched",
  "accepted",
  "agreed",
  "scheduled",
];

export async function GET(req: Request) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const sb = createServiceSupabase();
    const { data } = await sb
      .from("service_requests")
      .select("id, status, source, flow_status, service_type, pickup_lat, pickup_lng, pickup_address")
      .eq("motorist_id", auth.userId)
      .order("updated_at", { ascending: false })
      .limit(20);

    const rows = data ?? [];
    const hasOpen = rows.some(
      (r) =>
        OPEN_STATUSES.includes(String(r.status)) &&
        !(
          String(r.status) === "cancelled" ||
          String(r.status) === "expired"
        ),
    );

    const draft = rows.find(
      (r) => String(r.source ?? "") === "express" && String(r.status) === "draft",
    );

    return apiOk({
      hasOpen,
      expressPending: draft
        ? {
            requestId: String(draft.id),
            trade: String(draft.service_type),
            lat: Number(draft.pickup_lat ?? 0),
            lng: Number(draft.pickup_lng ?? 0),
            locationLabel: String(draft.pickup_address || "Near you"),
          }
        : null,
    });
  } catch (e) {
    return apiFail(e instanceof Error ? e.message : "Lookup failed", 500);
  }
}

const cancelSchema = z.object({
  requestId: z.string().min(8),
  mode: z.enum(["payment", "both"]).default("both"),
});

/** Cancel an unpaid Express payment session (optionally with its draft). */
export async function POST(req: Request) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const parsed = cancelSchema.safeParse(await req.json());
    if (!parsed.success) return apiFail("Invalid cancel request", 400);

    const sb = createServiceSupabase();
    const now = new Date().toISOString();

    // Close any open payment session for this booking
    const { error: payErr } = await sb
      .from("ona_express_payments")
      .update({ status: "cancelled", updated_at: now })
      .eq("request_id", parsed.data.requestId)
      .eq("user_id", auth.userId)
      .eq("status", "pending");
    if (payErr) return apiFail(payErr.message, 500);

    if (parsed.data.mode === "both") {
      const { data: cancelled, error } = await sb
        .from("service_requests")
        .update({
          status: "cancelled",
          flow_status: "cancelled",
          pairing_stage: null,
          pairing_deadline: null,
          cancelled_at: now,
          cancel_reason: "customer cancelled during Ona Express payment",
        })
        .eq("id", parsed.data.requestId)
        .eq("motorist_id", auth.userId)
        .eq("source", "express")
        .eq("status", "draft")
        .select("id");
      if (error) return apiFail(error.message, 500);
      if (!cancelled?.length) {
        // Nothing matched: fine if the request is already closed, but never
        // report success while a resumable draft is still sitting there.
        const { data: still } = await sb
          .from("service_requests")
          .select("status")
          .eq("id", parsed.data.requestId)
          .eq("motorist_id", auth.userId)
          .maybeSingle();
        if (String(still?.status) === "draft") {
          return apiFail("Could not cancel this request. Try again.", 500);
        }
      }
    }

    return apiOk({ ok: true });
  } catch (e) {
    return apiFail(e instanceof Error ? e.message : "Cancel failed", 500);
  }
}
