import "server-only";
import type { createServiceSupabase } from "@/lib/supabase/server";

/** Database transaction owns both the offer and its matching assignment. */
export async function dispatchPairingOffer(
  sb: ReturnType<typeof createServiceSupabase>,
  input: {
    jobId: string;
    expectedVersion: number;
    expectedStage: string | null;
    proId: string;
    proName: string;
    proPhoto: string | null;
    remaining: number;
  },
): Promise<"dispatched" | "conflict" | "noop" | "unavailable"> {
  const { data, error } = await sb.rpc("dispatch_pairing_offer", {
    p_request_id: input.jobId,
    p_expected_version: input.expectedVersion,
    p_expected_stage: input.expectedStage,
    p_pro_id: input.proId,
    p_pro_name: input.proName,
    p_pro_photo: input.proPhoto,
    p_remaining: input.remaining,
  });
  if (error || !["dispatched", "conflict", "noop"].includes(data)) return "unavailable";
  return data as "dispatched" | "conflict" | "noop";
}
