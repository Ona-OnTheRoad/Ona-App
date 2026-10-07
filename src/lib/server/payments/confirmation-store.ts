/** Narrow, fail-closed persistence for confirmation; no live database fallback. */
import type { JobRecord } from "@/lib/jobs/types";
import { assertTransition } from "@/lib/jobs/state-machine";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { getJobRaw } from "@/lib/server/jobs/job-store/reads";
import { flowToLegacyStatus, rowToJob } from "@/lib/server/jobs/job-store/mappers";
import {
  getEscrowByRef, getEscrowByRequest, rowToEscrow, updateEscrow,
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

export async function holdConfirmedPayment(payment: EscrowPayment, verified: VerifyChargeResult) {
  const patch = {
    status: "paid", escrowStatus: "held" as const,
    paidAt: verified.paidAt || new Date().toISOString(), providerChannel: verified.channel || null,
  };
  if (!isSupabaseAdminConfigured()) {
    const updated = await updateEscrow(payment.id, patch);
    if (!updated) throw new Error("Could not persist confirmed payment");
    return updated;
  }
  const { data, error } = await createServiceSupabase().from("payments").update({
    status: patch.status, escrow_status: patch.escrowStatus, paid_at: patch.paidAt,
    provider_channel: patch.providerChannel, updated_at: new Date().toISOString(),
  }).eq("id", payment.id).eq("updated_at", payment.updatedAt)
    .eq("escrow_status", payment.escrowStatus)
    .eq("provider", payment.provider).eq("provider_ref", payment.providerRef!)
    .eq("request_id", payment.requestId).eq("amount_kobo", payment.amountMinor)
    .eq("currency", payment.currency).eq("motorist_id", payment.motoristId)
    .eq("repair_pro_id", payment.repairProId).select("*").maybeSingle();
  if (error) throw new Error("Could not persist confirmed payment");
  // A concurrent confirmation/release/refund won. Reload; never regress its state.
  if (!data) {
    const fresh = await loadConfirmationPayment({ reference: payment.providerRef! });
    if (!fresh) throw new Error("Payment disappeared during confirmation");
    return fresh;
  }
  const saved = rowToEscrow(data as Record<string, unknown>);
  // Preserve the existing best-effort backup hook, only for the hold-write winner.
  try {
    const { triggerBackupAfterPaymentChange } = await import("@/lib/server/local-backup-trigger");
    triggerBackupAfterPaymentChange("payment_held");
  } catch { /* backups never determine payment acceptance */ }
  return saved;
}

export async function bookConfirmedJob(job: JobRecord, payment: EscrowPayment) {
  const ts = new Date().toISOString();
  const updated: JobRecord = {
    ...job, status: assertTransition(job.status, { type: "PAYMENT_SUCCESS" }),
    paymentId: payment.id, paymentReference: payment.providerRef,
    amountMinor: payment.amountMinor, platformFeeMinor: payment.platformFeeMinor,
    proPayoutMinor: payment.proPayoutMinor, escrowStatus: "held", paidAt: ts, updatedAt: ts,
    statusHistory: [...job.statusHistory, { status: "paid_booked", at: ts, by: "system" }],
  };
  if (!isSupabaseAdminConfigured()) throw new Error("Job persistence is unavailable");
  const { data, error } = await createServiceSupabase().from("service_requests")
    .update({
      flow_status: updated.status, status: flowToLegacyStatus(updated.status),
      payment_id: payment.id, payment_reference: payment.providerRef,
      amount_minor: payment.amountMinor, platform_fee_minor: payment.platformFeeMinor,
      pro_payout_minor: payment.proPayoutMinor, labour_agreed_kobo: payment.amountMinor,
      escrow_status: "held", paid_at: ts, updated_at: ts,
      status_history: updated.statusHistory, negotiation_status: "paid",
    }).eq("id", job.id).eq("flow_status", "agreed")
    .eq("job_version", job.jobVersion ?? 0)
    .eq("payment_reference", payment.providerRef!).eq("updated_at", job.updatedAt)
    .select("*").maybeSingle();
  if (error) throw new Error("Could not persist booked job");
  if (!data) return loadConfirmationJob(job.id);
  const saved = rowToJob(data as Record<string, unknown>);
  // Only the conditional-write winner emits the event. Booking has no notification side effects.
  try {
    const { error: eventError } = await createServiceSupabase().from("job_events").insert({
      request_id: job.id, event_type: "status", payload: { status: "paid_booked" },
    });
    if (eventError) console.error("Confirmed booking event could not be saved", { jobId: job.id });
  } catch {
    console.error("Confirmed booking event could not be saved", { jobId: job.id });
  }
  return saved;
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
