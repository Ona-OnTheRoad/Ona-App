import { apiFail, apiOk } from "@/lib/server/api-json";
import { hasSchedulerSecret } from "@/lib/server/jobs/deadlines/scheduler-auth";
import { SweepBusyError } from "@/lib/server/jobs/deadlines/sweep-lease";
import { sweepNegotiationDeadlines } from "@/lib/server/jobs/deadlines/negotiation-expiry";
import { sweepPairing } from "@/lib/server/pairing/pairing-engine";
import { processPaymentLifecycleBatch } from "@/lib/server/payments/durable-processing";
import { expireOverdueBookedJobs } from "@/lib/server/jobs/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Minute scheduler: deadline progression and durable payment lifecycle work. */
async function run(req: Request) {
  if (!hasSchedulerSecret(req)) return apiFail("Unauthorized", 401, "unauthorized");
  const startedAt = new Date().toISOString();
  const results = await Promise.allSettled([sweepPairing(25), sweepNegotiationDeadlines(25), processPaymentLifecycleBatch(10), expireOverdueBookedJobs(20)]);
  const names = ["pairing", "negotiation", "payments", "jobDeadlines"] as const;
  const outcomes = Object.fromEntries(results.map((result, index) => [names[index],
    result.status === "fulfilled" ? { status: "completed", ...result.value }
      : { status: result.reason instanceof SweepBusyError ? "busy" : "failed" }]));
  const failed = results.some((result) => result.status === "rejected");
  console[failed ? "error" : "info"]("Deadline sweep", { startedAt, finishedAt: new Date().toISOString(), outcomes });
  if (failed) return apiFail("Deadline sweep incomplete; retry", 503, "sweep_incomplete", { outcomes });
  return apiOk({ startedAt, outcomes });
}

export const GET = run;
export const POST = run;
