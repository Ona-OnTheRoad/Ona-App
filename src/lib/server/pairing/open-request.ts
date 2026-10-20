import "server-only";
import type { createServiceSupabase } from "@/lib/supabase/server";
import type { PairingResult } from "./pairing-engine";

/** Atomic Open reads the latest locked row; classification/surface cannot win a stale CAS. */
export async function openPairingRequest(
  sb: ReturnType<typeof createServiceSupabase>,
  input: { jobId: string; proId: string; key?: string | null; windowMs: number; rearmFloorMs: number },
): Promise<PairingResult> {
  const { data, error } = await sb.rpc("open_pairing_request", {
    p_request_id: input.jobId,
    p_pro_id: input.proId,
    p_idempotency_key: input.key || null,
    p_window_ms: input.windowMs,
    p_rearm_floor_ms: input.rearmFloorMs,
  });
  if (error) return { ok: false, error: "Could not open this request. Please try again.", status: 503 };
  if (data === "opened" || data === "noop") {
    return { ok: true, jobId: input.jobId, currentProId: input.proId, ...(data === "noop" ? { noop: true } : {}) };
  }
  if (data === "not_found") return { ok: false, error: "Job not found", status: 404 };
  if (data === "forbidden") return { ok: false, error: "Not assigned to this request", status: 403 };
  if (data === "closed") return { ok: false, error: "Request is not open for this action", status: 409 };
  if (data === "reservation_conflict") return { ok: false, error: "Could not reserve this request. Please reload and retry.", status: 409 };
  return { ok: false, error: "Could not open this request. Please try again.", status: 503 };
}
