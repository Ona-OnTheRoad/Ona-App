import "server-only";
/** Narrow, fail-closed persistence for confirmation; no live database fallback. */
import type { JobRecord } from "@/lib/jobs/types";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { getJobRaw } from "@/lib/server/jobs/job-store/reads";
import { rowToJob } from "@/lib/server/jobs/job-store/mappers";
import {
  getEscrowByRef, getEscrowByRequest, rowToEscrow,
  type EscrowPayment,
} from "./escrow-store";
import type { VerifyChargeResult } from "./providers";

export async function loadConfirmationPayment(input: { reference?: string; jobId?: string }) {
  if (!isSupabaseAdminConfigured()) {
    const payment = input.reference
      ? await getEscrowByRef(input.reference) : await getEscrowByRequest(input.jobId || "");
    if (payment && payment.provider !== "mock") throw new Error("Payment database is not configured");
    return payment;
  }
  const sb = createServiceSupabase();
  if (!input.reference && input.jobId) {
    const { data, error } = await sb.from("payments").select("*")
      .eq("request_id", input.jobId)
      .in("escrow_status", ["held", "released", "release_pending", "pending_settlement"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error("Could not load payment");
    if (data) return rowToEscrow(data as Record<string, unknown>);
  }
  let query = sb.from("payments").select("*");
  if (input.reference) query = query.eq("provider_ref", input.reference);
  else query = query.eq("request_id", input.jobId!).order("created_at", { ascending: false }).limit(1);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Could not load payment");
  return data ? rowToEscrow(data as Record<string, unknown>) : null;
}

export async function loadConfirmationJob(id: string): Promise<JobRecord | null> {
  if (!isSupabaseAdminConfigured()) return getJobRaw(id);
  const { data, error } = await createServiceSupabase().from("service_requests")
    .select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load payment job");
  return data ? rowToJob(data as Record<string, unknown>) : null;
}

export type AtomicPaymentBooking = {
  outcome: "confirmed" | "already_confirmed" | "conflict" | "terminal_job" |
    "payment_terminal" | "payment_not_payable" | "refunded" | "association_mismatch" |
    "not_found" | "job_not_found";
  job?: JobRecord;
  payment?: EscrowPayment;
};

/** Persist the verified payment and booked job, event, and outbox intent in one SQL transaction. */
export async function bookConfirmedJob(
  job: JobRecord,
  payment: EscrowPayment,
  verified: VerifyChargeResult,
): Promise<AtomicPaymentBooking> {
  if (!isSupabaseAdminConfigured()) throw new Error("Job/payment persistence is unavailable");
  const { data, error } = await createServiceSupabase().rpc("apply_confirmed_job_payment", {
    p_payment_id: payment.id,
    p_request_id: job.id,
    p_expected_job_version: job.jobVersion ?? 0,
    p_provider: payment.provider,
    p_provider_ref: payment.providerRef,
    p_verified_amount_kobo: verified.amountMinor,
    p_verified_currency: verified.currency,
    p_paid_at: verified.paidAt || payment.paidAt || new Date().toISOString(),
    p_provider_channel: verified.channel || payment.providerChannel,
  });
  if (error) throw new Error("Could not persist atomic payment booking");
  const result = data as { outcome?: string; job?: Record<string, unknown>; payment?: Record<string, unknown> } | null;
  const outcomes = new Set<AtomicPaymentBooking["outcome"]>([
    "confirmed", "already_confirmed", "conflict", "terminal_job", "payment_terminal",
    "payment_not_payable", "refunded", "association_mismatch", "not_found", "job_not_found",
  ]);
  const outcome = outcomes.has(result?.outcome as AtomicPaymentBooking["outcome"])
    ? result!.outcome as AtomicPaymentBooking["outcome"] : "association_mismatch";
  return {
    outcome,
    job: result?.job ? rowToJob(result.job) : undefined,
    payment: result?.payment ? rowToEscrow(result.payment) : undefined,
  };
}

/** Bind checkout only while the exact agreed job snapshot still owns the session. */
export async function bindJobCheckout(previous: JobRecord, checkout: JobRecord): Promise<JobRecord | null> {
  if (!isSupabaseAdminConfigured()) throw new Error("Job persistence is unavailable");
  const { data, error } = await createServiceSupabase().from("service_requests").update({
    payment_reference: checkout.paymentReference, payment_id: null,
    pricing_currency: checkout.currency, status_history: checkout.statusHistory, updated_at: checkout.updatedAt,
  }).eq("id", previous.id).eq("job_version", previous.jobVersion ?? 0)
    .eq("flow_status", "agreed").eq("updated_at", previous.updatedAt)
    .select("*").maybeSingle();
  if (error) throw new Error("Could not save checkout association");
  return data ? rowToJob(data as Record<string, unknown>) : null;
}
