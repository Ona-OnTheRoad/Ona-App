import { randomUUID } from "node:crypto";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export class SweepBusyError extends Error {}

/** Cross-instance lease. Missing migration/database fails closed, never falls back to a Map. */
export async function withSweepLease<T>(scope: "pairing" | "negotiation", operation: () => Promise<T>): Promise<T> {
  if (!isSupabaseAdminConfigured()) throw new Error("Sweep database is not configured");
  const sb = createServiceSupabase();
  const owner = randomUUID();
  const { data, error } = await sb.rpc("claim_job_sweep_lease", { p_scope: scope, p_owner: owner });
  if (error) throw new Error("Could not claim sweep lease");
  if (data !== true) throw new SweepBusyError("Sweep is already running");
  try { return await operation(); }
  finally {
    // A stale worker cannot release a newer owner's lease. Failure is retried after expiry.
    try {
      const { error: releaseError } = await sb.rpc("release_job_sweep_lease", { p_scope: scope, p_owner: owner });
      if (releaseError) console.error("Sweep lease release failed", { scope });
    } catch { console.error("Sweep lease release failed", { scope }); }
  }
}
