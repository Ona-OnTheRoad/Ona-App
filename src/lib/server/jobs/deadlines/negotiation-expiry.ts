import type { JobRecord } from "@/lib/jobs/types";
import { isNegotiationTimerArmed } from "@/lib/jobs/constants";
import { assertTransition } from "@/lib/jobs/state-machine";
import { createServiceSupabase } from "@/lib/supabase/server";
import { flowToLegacyStatus, rowToJob } from "@/lib/server/jobs/job-store/mappers";
import { JobPersistenceUnavailableError } from "@/lib/server/jobs/job-store/persistence-errors";
import { insertNotification } from "@/lib/server/notifications";
import { withSweepLease } from "./sweep-lease";

function isDue(job: JobRecord): boolean {
  return job.status === "negotiating" && isNegotiationTimerArmed(job) &&
    Date.parse(job.negotiateEndsAt) < Date.now();
}

/** Only the unchanged overdue negotiation can expire; never rewrite the full aggregate. */
export async function expireNegotiationIfOverdue(job: JobRecord): Promise<JobRecord> {
  if (!isDue(job)) return job;
  const ts = new Date().toISOString();
  const updated: JobRecord = { ...job,
    status: assertTransition(job.status, { type: "EXPIRE_NEGOTIATION" }),
    cancelledAt: ts, updatedAt: ts, pairingStage: null, pairingDeadline: null,
    reservationStatus: null, assignmentStatus: null,
    statusHistory: [...job.statusHistory, { status: "expired", at: ts, by: "system" }],
  };
  const sb = createServiceSupabase();
  const { data, error } = await sb.from("service_requests").update({
    flow_status: updated.status, status: flowToLegacyStatus(updated.status),
    cancelled_at: ts, updated_at: ts, status_history: updated.statusHistory,
    pairing_stage: null, pairing_deadline: null, reservation_status: null,
    assignment_status: null, negotiation_status: "none",
  }).eq("id", job.id).eq("flow_status", "negotiating").eq("updated_at", job.updatedAt)
    .eq("job_version", job.jobVersion ?? 0)
    .eq("negotiate_ends_at", job.negotiateEndsAt).lt("negotiate_ends_at", ts)
    .select("*").maybeSingle();
  if (error) throw new JobPersistenceUnavailableError("Could not persist negotiation expiry");
  if (!data) {
    const { data: fresh, error: readError } = await sb.from("service_requests").select("*")
      .eq("id", job.id).maybeSingle();
    if (readError) throw new JobPersistenceUnavailableError("Could not reload negotiation");
    return fresh ? rowToJob(fresh) : job;
  }
  const saved = rowToJob(data);
  // Best effort only, after the durable winner. No provider/refund/payout calls here.
  try {
    const { error: eventError } = await sb.from("job_events").insert({ request_id: job.id,
      event_type: "status", payload: { status: "expired" } });
    if (eventError) console.error("Negotiation expiry event failed", { jobId: job.id });
  } catch { console.error("Negotiation expiry event failed", { jobId: job.id }); }
  if (saved.repairProId) {
    const result = await insertNotification({ userId: saved.repairProId, category: "requests",
      priority: "normal", title: "Request expired",
      body: saved.motoristName?.split(/\s+/)[0] ? `${saved.motoristName.split(/\s+/)[0]}'s request expired.` : "This request expired.",
      href: `/jobs/${saved.id}`, actionType: "open_job", actionPayload: { jobId: saved.id },
      jobId: saved.id, jobStatus: "expired", groupKey: `request-expired-${saved.id}` });
    if ("error" in result) console.error("Negotiation expiry notification failed", { jobId: job.id });
  }
  return saved;
}

export async function sweepNegotiationDeadlines(limit = 25) {
  return withSweepLease("negotiation", async () => {
    const { data, error } = await createServiceSupabase().from("service_requests").select("*")
      .eq("flow_status", "negotiating").not("negotiate_ends_at", "is", null)
      .lt("negotiate_ends_at", new Date().toISOString())
      .order("negotiate_ends_at", { ascending: true }).order("id", { ascending: true }).limit(limit);
    if (error) throw new Error("Could not load overdue negotiations");
    let expired = 0;
    for (const row of data || []) {
      if ((await expireNegotiationIfOverdue(rowToJob(row))).status === "expired") expired++;
    }
    return { checked: data?.length || 0, expired, batchFull: data?.length === limit };
  });
}
