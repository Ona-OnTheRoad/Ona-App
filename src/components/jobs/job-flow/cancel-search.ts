import { cancelJobConfirmed } from "@/lib/jobs/cancel-job";

export type CancelSearchResult = { ok: true } | { ok: false; message: string };

/** Cancel a customer's search; resolves ok only once the server closed it. */
export async function cancelSearchRequest(
  input: { jobId: string; motoristId: string },
  deps?: Parameters<typeof cancelJobConfirmed>[1],
): Promise<CancelSearchResult> {
  const res = await cancelJobConfirmed(
    {
      jobId: input.jobId,
      actor: "motorist",
      actorId: input.motoristId,
      reason: "motorist_cancelled_search",
    },
    deps,
  );
  return res.ok ? { ok: true } : { ok: false, message: res.message };
}
