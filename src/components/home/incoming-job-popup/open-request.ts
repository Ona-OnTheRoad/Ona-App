import { apiTransition } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { idemFor } from "./helpers";

export type OpenResult = Awaited<ReturnType<typeof apiTransition>>;
export type PendingOpens = Map<string, Promise<OpenResult>>;
export const openRequestKey = (jobId: string, proId: string) => `${proId}:${jobId}`;

/** Automatic surface and acceptance share the same network result, not a flag. */
export function ensureIncomingRequestOpen(
  job: JobRecord,
  proId: string,
  pending: PendingOpens,
): Promise<OpenResult> {
  const key = openRequestKey(job.id, proId);
  const existing = pending.get(key);
  if (existing) return existing;
  const request = apiTransition({
    jobId: job.id,
    event: "OPEN",
    actor: "repair_pro",
    actorId: proId,
    idempotencyKey: idemFor(job, proId, "OPEN"),
  }).catch(() => ({ ok: false as const, message: "Could not open this request. Please try again." }))
    .finally(() => { if (pending.get(key) === request) pending.delete(key); });
  pending.set(key, request);
  return request;
}
