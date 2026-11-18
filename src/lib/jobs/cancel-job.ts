import { apiGetJob, apiTransition } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";

export type CancelJobResult =
  | { ok: true; job: JobRecord | null }
  | { ok: false; message: string };

type Deps = { transition: typeof apiTransition; getJob: typeof apiGetJob };

const CLOSED = new Set(["cancelled", "expired"]);
const FAIL_MESSAGE = "We could not cancel this request. Check your connection and try again.";

/**
 * Cancel a request and confirm the SERVER closed it before the caller leaves
 * the screen. Cancelling optimistically and navigating away meant any failed or
 * slow CANCEL call left the request alive on the server, so it kept showing on
 * the customer's home screen as an open request that could be resumed.
 * A job the server already closed (cancelled / expired) counts as cancelled.
 */
export async function cancelJobConfirmed(
  input: {
    jobId: string;
    actor: "motorist" | "repair_pro";
    actorId?: string;
    reason?: string;
  },
  deps: Deps = { transition: apiTransition, getJob: apiGetJob },
): Promise<CancelJobResult> {
  try {
    const res = await deps.transition({
      jobId: input.jobId,
      event: "CANCEL",
      actor: input.actor,
      actorId: input.actorId,
      ...(input.reason ? { reason: input.reason } : {}),
    });
    if (res.ok) return { ok: true, job: res.data.job };
    const fresh = await deps.getJob(input.jobId, { source: "job-screen", trigger: "action" });
    if (fresh.ok && CLOSED.has(String(fresh.data.job.status))) {
      return { ok: true, job: fresh.data.job };
    }
    return { ok: false, message: FAIL_MESSAGE };
  } catch {
    return { ok: false, message: FAIL_MESSAGE };
  }
}
