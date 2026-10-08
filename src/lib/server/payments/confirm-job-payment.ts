import "server-only";
import type { JobRecord } from "@/lib/jobs/types";
import type { EscrowPayment } from "./escrow-store";
import { isProductionRuntime, verifyCharge, type VerifyChargeResult } from "./providers";
import {
  loadConfirmationPayment, loadConfirmationJob, bookConfirmedJob,
} from "./confirmation-store";

export type ConfirmationInput = { reference?: string; jobId?: string; expectedProvider?: string; motoristId?: string };
type SuccessResult = { payment: EscrowPayment; job: JobRecord; message?: undefined };
type FailureResult = { code?: string; message: string; retryable?: boolean; payment?: EscrowPayment; job?: undefined };
export type ConfirmationResult =
  | ({ outcome: "confirmed" } & SuccessResult)
  | ({ outcome: "already_confirmed" } & SuccessResult)
  | ({ outcome: "pending" } & FailureResult)
  | ({ outcome: "rejected" } & FailureResult);

const funded = new Set(["held", "released", "release_pending", "pending_settlement"]);
const booked = new Set(["paid_booked", "en_route", "arrived", "in_progress", "completed", "satisfied", "released"]);
// Serializes attempts within one worker; database conditional writes protect other workers.
const inFlight = new Map<string, Promise<ConfirmationResult>>();

function associationError(payment: EscrowPayment, job: JobRecord): string | null {
  if (payment.requestId !== job.id || payment.motoristId !== job.motoristId ||
      payment.repairProId !== job.repairProId) return "Payment parties do not match the stored job";
  if (job.paymentReference && job.paymentReference !== payment.providerRef) return "Payment reference does not match the stored job";
  if (job.paymentId && job.paymentId !== payment.id) return "Payment ID does not match the stored job";
  if (booked.has(job.status) && (!job.paymentReference || job.paymentReference !== payment.providerRef)) {
    return "Booked job is associated with another payment";
  }
  if (!booked.has(job.status) && job.status !== "agreed") {
    return "Job is no longer payable";
  }
  return null;
}

async function confirm(input: ConfirmationInput): Promise<ConfirmationResult> {
  const payment = await loadConfirmationPayment(input);
  if (!payment) return { outcome: "rejected", code: "not_found", message: "Payment not found" };
  if (input.motoristId && payment.motoristId !== input.motoristId) {
    return { outcome: "rejected", code: "forbidden", message: "Only the customer on this payment can verify it" };
  }
  const reject = (message: string): ConfirmationResult => ({ outcome: "rejected", message, payment: payment! });
  if (!payment.providerRef || (input.reference && input.reference !== payment.providerRef) ||
      (input.jobId && input.jobId !== payment.requestId) ||
      (input.expectedProvider && input.expectedProvider !== payment.provider)) {
    return reject("Payment association does not match");
  }
  if (!["flutterwave", "paystack", "mock"].includes(payment.provider)) return reject("Unsupported stored payment provider");
  if (payment.provider === "mock" && isProductionRuntime()) return reject("Mock payments are disabled on deployed runtimes");
  if (!Number.isSafeInteger(payment.amountMinor) || payment.amountMinor <= 0 || !payment.currency) {
    return reject("Invalid stored payment obligation");
  }
  if (payment.escrowStatus === "refunded" || payment.refundedAt) return reject("Payment has been refunded");
  let job = await loadConfirmationJob(payment.requestId);
  if (!job) return reject("Job not found for this payment");
  if (["released", "release_pending", "pending_settlement"].includes(payment.escrowStatus) && !booked.has(job.status)) {
    return reject("Payment is no longer payable");
  }
  // A notification can precede checkout binding. Never book a draft reference or acknowledge it as terminal.
  if (job.status === "agreed" && job.paymentReference !== payment.providerRef && payment.meta.superseded !== true) {
    return { outcome: "pending", code: "checkout_pending", retryable: true,
      message: "Checkout association is not ready. Check again.", payment };
  }
  const mismatch = associationError(payment, job);
  if (mismatch) return reject(mismatch);
  const alreadyFunded = funded.has(payment.escrowStatus);
  let verified: VerifyChargeResult = {
    success: true,
    reference: payment.providerRef!,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    channel: payment.providerChannel || undefined,
    paidAt: payment.paidAt || undefined,
  };
  if (!alreadyFunded) {
    verified = await verifyCharge(payment.providerRef, payment.provider, { strictProvider: true });
    if (!verified.success) return { outcome: "pending", message: "Payment not confirmed yet. Wait and try again.", payment };
    if (verified.reference !== payment.providerRef) return reject("Provider transaction reference does not match");
    // Flutterwave amount is in major units; Paystack amount is already in minor units.
    // Checkout instructs exact payment. No zero acceptance or invented tolerance.
    if (payment.provider !== "mock" && (
      !Number.isSafeInteger(verified.amountMinor) || verified.amountMinor <= 0 ||
      verified.amountMinor !== payment.amountMinor || verified.currency !== payment.currency
    )) return reject("Provider amount or currency does not match the stored payment");
  }
  // Refresh after provider I/O; the RPC rechecks this exact version under row lock.
  job = await loadConfirmationJob(payment.requestId);
  if (!job) return reject("Job not found for this payment");
  const freshMismatch = associationError(payment, job);
  if (freshMismatch) return reject(freshMismatch);
  const booking = await bookConfirmedJob(job, payment, verified);
  if (booking.outcome === "confirmed" || booking.outcome === "already_confirmed") {
    const savedJob = booking.job;
    const savedPayment = booking.payment || payment;
    if (!savedJob || !booked.has(savedJob.status) || associationError(savedPayment, savedJob)) {
      return { outcome: "pending", code: "booking_reload_required", message: "Booking is being reconciled. Check again.", retryable: true, payment: savedPayment };
    }
    return { outcome: booking.outcome === "confirmed" && !alreadyFunded ? "confirmed" : "already_confirmed",
      payment: savedPayment, job: savedJob };
  }
  if (booking.outcome === "conflict") {
    return { outcome: "pending", code: "job_conflict", message: "Job changed during payment confirmation. Check again.", retryable: true, payment };
  }
  if (booking.outcome === "terminal_job" || booking.outcome === "payment_terminal" || booking.outcome === "payment_not_payable") {
    return { outcome: "rejected", code: "manual_recovery", message: "Verified payment requires manual recovery because the job or payment is no longer payable.", payment };
  }
  if (booking.outcome === "refunded") return reject("Payment has been refunded");
  if (booking.outcome === "not_found" || booking.outcome === "job_not_found") return reject("Payment or job no longer exists");
  return { outcome: "rejected", code: "association_mismatch", message: "Payment association changed before booking.", payment };
}

/** Only this operation accepts job collection payments. Caller hints cannot override obligations. */
export async function confirmJobPayment(input: ConfirmationInput): Promise<ConfirmationResult> {
  if (!input.reference && !input.jobId) return { outcome: "rejected", message: "reference or jobId required" };
  // Hints form part of the key so mismatched callers never inherit an accepted result.
  const key = JSON.stringify(input);
  const existing = inFlight.get(key);
  if (existing) return existing;
  const operation = confirm(input).catch((error): ConfirmationResult => {
    // No payloads, provider credentials or personal payment metadata in logs.
    console.error("Job payment confirmation unavailable", { jobId: input.jobId,
      error: error instanceof Error ? error.name : "UnknownError" });
    return { outcome: "pending", code: "confirmation_unavailable",
      message: "Payment verification unavailable. Check again.", retryable: true };
  });
  inFlight.set(key, operation);
  try { return await operation; } finally { inFlight.delete(key); }
}
