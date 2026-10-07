import "server-only";
import { confirmJobPayment, type ConfirmationResult } from "./confirm-job-payment";
import { rowToEscrow } from "./escrow-store";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rowToJob } from "@/lib/server/jobs/job-store/mappers";
import { clearFalseSatisfiedStamp, recoverReleasedFromFlutterwave } from "@/lib/server/jobs/job-store/recovery";

type InboxRow = { id: string; provider: string; provider_ref: string; status: string; attempts: number };
type ReconciliationRow = { payment_id: string; status: string; attempts: number };
type BatchResult = { checked: number; completed: number; retried: number; manualReview: number; rejected: number };

function retryDelay(attempts: number): number {
  return Math.min(3600, 10 * 2 ** Math.min(Math.max(0, attempts - 1), 8));
}

export async function enqueuePaymentWebhook(input: {
  provider: string; dedupeKey: string; eventType: string; providerRef: string;
  payload?: Record<string, unknown>;
}): Promise<{ id: string; status: string }> {
  const sb = createServiceSupabase();
  const { error: upsertError } = await sb.from("payment_webhook_inbox").upsert({
    provider: input.provider, dedupe_key: input.dedupeKey, event_type: input.eventType,
    provider_ref: input.providerRef, payload: input.payload || {},
  }, { onConflict: "provider,dedupe_key", ignoreDuplicates: true });
  if (upsertError) throw new Error("Could not durably accept payment notification");
  const { data, error } = await sb.from("payment_webhook_inbox").select("id,status")
    .eq("provider", input.provider).eq("dedupe_key", input.dedupeKey).maybeSingle();
  if (error || !data) throw new Error("Could not reload payment notification");
  return { id: String(data.id), status: String(data.status) };
}

async function finishInbox(id: string, result: ConfirmationResult, attempts: number) {
  let status: "processed" | "retry" | "rejected" | "manual_review";
  const code = ("code" in result ? result.code : undefined) || null;
  if (result.outcome === "confirmed" || result.outcome === "already_confirmed") status = "processed";
  else if (result.outcome === "pending" || result.code === "not_found" || result.code === "checkout_pending") status = "retry";
  else if (result.code === "manual_recovery" || result.code === "association_mismatch") status = "manual_review";
  else status = "rejected";
  const { data, error } = await createServiceSupabase().rpc("finish_payment_webhook_inbox", {
    p_id: id, p_attempt: attempts, p_status: status, p_error_code: code, p_retry_seconds: retryDelay(attempts),
  });
  if (error) throw new Error("Could not persist payment notification outcome");
  return String(data || status);
}

async function processClaimedInbox(row: InboxRow) {
  let result: ConfirmationResult;
  try {
    result = await confirmJobPayment({ reference: row.provider_ref, expectedProvider: row.provider });
  } catch {
    result = { outcome: "pending", code: "worker_error", message: "Payment processing will retry.", retryable: true };
  }
  return { status: await finishInbox(row.id, result, row.attempts), result };
}

export async function processPaymentWebhookEvent(id: string): Promise<{ status: string; result?: ConfirmationResult }> {
  const sb = createServiceSupabase();
  const { data, error } = await sb.rpc("claim_payment_webhook_inbox", {
    p_limit: 1, p_lease_seconds: 120, p_event_id: id,
  });
  if (error) throw new Error("Could not claim payment notification");
  const row = (Array.isArray(data) ? data[0] : null) as InboxRow | null;
  if (row) {
    const processed = await processClaimedInbox(row);
    if (processed.status === "processed") await drainJobOutbox(10);
    return processed;
  }
  const { data: fresh, error: readError } = await sb.from("payment_webhook_inbox").select("status").eq("id", id).maybeSingle();
  if (readError || !fresh) throw new Error("Could not read payment notification state");
  return { status: String(fresh.status) };
}

export async function processPaymentInboxBatch(limit = 10): Promise<BatchResult> {
  const { data, error } = await createServiceSupabase().rpc("claim_payment_webhook_inbox", {
    p_limit: limit, p_lease_seconds: 120, p_event_id: null,
  });
  if (error) throw new Error("Could not claim payment notifications");
  const rows = (Array.isArray(data) ? data : []) as InboxRow[];
  const result: BatchResult = { checked: rows.length, completed: 0, retried: 0, manualReview: 0, rejected: 0 };
  for (const row of rows) {
    const processed = await processClaimedInbox(row);
    if (processed.status === "processed") result.completed++;
    else if (processed.status === "retry") result.retried++;
    else if (processed.status === "manual_review") result.manualReview++;
    else if (processed.status === "rejected") result.rejected++;
  }
  return result;
}

async function processClaimedReconciliation(row: ReconciliationRow): Promise<string> {
  const sb = createServiceSupabase();
  let outcome: "completed" | "retry" | "manual_review" = "retry";
  let code = "reconciliation_unavailable";
  try {
    const { data, error } = await sb.from("payments").select("*").eq("id", row.payment_id).maybeSingle();
    if (error) throw error;
    if (!data) {
      outcome = "manual_review";
      code = "payment_missing";
    } else {
      const payment = rowToEscrow(data as Record<string, unknown>);
      if (payment.meta.superseded === true) {
        outcome = "completed";
        code = "superseded_or_failed_intent";
      } else if (!payment.providerRef) {
        outcome = "manual_review";
        code = "reference_missing";
      } else {
        const result = await confirmJobPayment({ reference: payment.providerRef, expectedProvider: payment.provider });
        if (result.outcome === "confirmed" || result.outcome === "already_confirmed") {
          outcome = "completed";
          code = "";
        } else if (result.outcome === "rejected" && result.code !== "not_found" && result.code !== "checkout_pending") {
          outcome = "manual_review";
          code = result.code || "payment_rejected";
        } else {
          outcome = "retry";
          code = result.code || "payment_pending";
        }
      }
    }
  } catch {
    outcome = "retry";
    code = "reconciliation_unavailable";
  }
  const { data, error } = await sb.rpc("finish_payment_reconciliation", {
    p_payment_id: row.payment_id, p_attempt: row.attempts, p_status: outcome, p_error_code: code || null,
    p_retry_seconds: retryDelay(row.attempts),
  });
  if (error) throw new Error("Could not persist reconciliation outcome");
  return String(data || outcome);
}

export async function processPaymentReconciliationBatch(limit = 10): Promise<BatchResult> {
  const { data, error } = await createServiceSupabase().rpc("claim_payment_reconciliation", {
    p_limit: limit, p_lease_seconds: 120,
  });
  if (error) throw new Error("Could not claim payment reconciliation work");
  const rows = (Array.isArray(data) ? data : []) as ReconciliationRow[];
  const result: BatchResult = { checked: rows.length, completed: 0, retried: 0, manualReview: 0, rejected: 0 };
  for (const row of rows) {
    const status = await processClaimedReconciliation(row);
    if (status === "completed") result.completed++;
    else if (status === "retry") result.retried++;
    else result.manualReview++;
  }
  return result;
}

export async function drainJobOutbox(limit = 25): Promise<{ delivered: number; failed: number }> {
  const { data, error } = await createServiceSupabase().rpc("drain_job_outbox", { p_limit: limit });
  if (error) throw new Error("Could not drain job outbox");
  const result = data as { delivered?: unknown; failed?: unknown } | null;
  return { delivered: Number(result?.delivered || 0), failed: Number(result?.failed || 0) };
}

export async function processJobStateRecoveryBatch(limit = 10): Promise<{ checked: number; recovered: number }> {
  const sb = createServiceSupabase();
  const [releasable, falseStamps] = await Promise.all([
    sb.from("service_requests").select("*")
      .or("flow_status.eq.satisfied,escrow_status.eq.release_pending,escrow_status.eq.pending_settlement")
      .order("updated_at", { ascending: true }).limit(limit),
    sb.from("service_requests").select("*").eq("flow_status", "completed")
      .not("satisfied_at", "is", null).order("updated_at", { ascending: true }).limit(limit),
  ]);
  if (releasable.error || falseStamps.error) throw new Error("Could not load job recovery work");
  const rows = new Map<string, Record<string, unknown>>();
  for (const row of [...(releasable.data || []), ...(falseStamps.data || [])]) rows.set(String(row.id), row as Record<string, unknown>);
  let recovered = 0;
  for (const row of rows.values()) {
    const job = rowToJob(row);
    let next = await clearFalseSatisfiedStamp(job);
    next = await recoverReleasedFromFlutterwave(next);
    if (next.updatedAt !== job.updatedAt || next.status !== job.status || next.escrowStatus !== job.escrowStatus) recovered++;
  }
  return { checked: rows.size, recovered };
}

export async function processPaymentLifecycleBatch(limit = 10) {
  const inbox = await processPaymentInboxBatch(limit);
  const reconciliation = await processPaymentReconciliationBatch(limit);
  const outbox = await drainJobOutbox(limit * 2);
  const jobRecovery = await processJobStateRecoveryBatch(limit);
  return { inbox, reconciliation, outbox, jobRecovery };
}
