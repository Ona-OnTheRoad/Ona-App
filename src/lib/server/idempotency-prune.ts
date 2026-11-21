import "server-only";
/**
 * Retention for the idempotent-operations ledger (migration 064).
 *
 * A ledger row is only read by its op_key, and a client keeps an op_key for
 * at most 48 hours (IDEM_KEY_TTL_MS in src/lib/jobs/idempotency.ts). After
 * that nobody can replay or verify the row, so it is dead weight. Rows are
 * kept 7 days, well past the client TTL, so a skewed clock or a missed cron
 * run never removes one a client might still send.
 *
 * Every status is pruned: a row still "running" after 7 days was abandoned.
 */
import { createServiceSupabase } from "@/lib/supabase/server";

export const IDEMPOTENT_OPS_RETENTION_DAYS = 7;

export type PruneIdempotentOpsResult =
  | { ok: true; deleted: number; cutoff: string }
  | { ok: false; error: string };

export async function pruneIdempotentOps(
  opts: { olderThanDays?: number; now?: Date } = {},
): Promise<PruneIdempotentOpsResult> {
  const days = opts.olderThanDays ?? IDEMPOTENT_OPS_RETENTION_DAYS;
  const now = opts.now ?? new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await createServiceSupabase()
    .from("idempotent_ops")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);

  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: count ?? 0, cutoff };
}
