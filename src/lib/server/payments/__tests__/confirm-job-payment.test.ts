import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRecord } from "@/lib/jobs/types";
import type { EscrowPayment } from "../escrow-store";
import { confirmJobPayment } from "../confirm-job-payment";
import * as store from "../confirmation-store";
import * as providers from "../providers";
import { reconcileJobPayment, releaseJobEscrow, markJobPaidFromReference } from "@/lib/server/jobs/job-store/payments";
import { attemptProPayout } from "../payout-settlement";
import { requireUser } from "@/lib/server/auth-utils";
import { POST as verifyPost } from "@/app/api/payments/verify/route";
import { POST as webhookPost } from "@/app/api/payments/webhooks/flutterwave/route";

vi.mock("../confirmation-store", () => ({
  loadConfirmationPayment: vi.fn(), loadConfirmationJob: vi.fn(),
  bookConfirmedJob: vi.fn(),
}));
vi.mock("../durable-processing", async () => {
  const { confirmJobPayment } = await import("../confirm-job-payment");
  return {
    enqueuePaymentWebhook: vi.fn(async () => ({ id: "inbox-1", status: "pending" })),
    processPaymentWebhookEvent: vi.fn(async () => {
      const result = await confirmJobPayment({ reference: "ona_ref", expectedProvider: "flutterwave" });
      const retry = result.outcome === "pending" || (result.outcome === "rejected" && "code" in result && ["not_found", "checkout_pending"].includes(result.code || ""));
      return { status: result.outcome === "confirmed" || result.outcome === "already_confirmed" ? "processed" : retry ? "retry" : "rejected", result };
    }),
  };
});
vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("../providers", () => ({ verifyCharge: vi.fn(), isProductionRuntime: vi.fn(() => false) }));

vi.mock("../escrow-store", async (importOriginal) => ({
  ...await importOriginal<typeof import("../escrow-store")>(),
  getEscrowByRequest: vi.fn(async () => payment),
}));
vi.mock("../payout-settlement", () => ({ attemptProPayout: vi.fn(async () => ({ ok: true })) }));

let payment: EscrowPayment;
let job: JobRecord;
const transaction = { success: true, reference: "ona_ref", amountMinor: 100_000, currency: "NGN" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ ok: true, userId: "customer" } as Awaited<ReturnType<typeof requireUser>>);
  vi.stubEnv("FLUTTERWAVE_WEBHOOK_SECRET_HASH", "test-notification-secret");
  payment = {
    id: "payment-1", requestId: "job-1", motoristId: "customer", repairProId: "pro",
    amountMinor: 100_000, currency: "NGN", provider: "flutterwave", providerRef: "ona_ref",
    escrowStatus: "pending_payment", status: "pending", meta: {},
  } as EscrowPayment;
  job = {
    id: "job-1", motoristId: "customer", repairProId: "pro", status: "agreed",
    paymentReference: "ona_ref", statusHistory: [], updatedAt: "2026-10-07T00:00:00Z",
  } as unknown as JobRecord;
  vi.mocked(providers.isProductionRuntime).mockReturnValue(false);
  vi.mocked(providers.verifyCharge).mockResolvedValue({ ...transaction });
  vi.mocked(store.loadConfirmationPayment).mockImplementation(async () => payment);
  vi.mocked(store.loadConfirmationJob).mockImplementation(async () => job);
  vi.mocked(store.bookConfirmedJob).mockImplementation(async () => {
    const transitioning = job.status === "agreed";
    if (transitioning) {
      job = { ...job, status: "paid_booked", paymentId: payment.id,
        statusHistory: [...job.statusHistory, { status: "paid_booked", at: "now", by: "system" }] };
    }
    payment = { ...payment, status: "paid", escrowStatus: "held" };
    return { outcome: transitioning ? "confirmed" : "already_confirmed", job, payment };
  });
});

function request(body: unknown, secret = "test-notification-secret") {
  return new Request("http://localhost/api/payments", {
    method: "POST", headers: { "Content-Type": "application/json", "verif-hash": secret },
    body: JSON.stringify(body),
  });
}

function expectNoAcceptance() {
  expect(store.bookConfirmedJob).not.toHaveBeenCalled();
}

describe("stored job payment confirmation", () => {
  it("confirms exact successful collection and repeats without effects", async () => {
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("confirmed");
    expect(providers.verifyCharge).toHaveBeenCalledWith("ona_ref", "flutterwave", { strictProvider: true });
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("already_confirmed");
    expect(providers.verifyCharge).toHaveBeenCalledTimes(1);
    expect(store.bookConfirmedJob).toHaveBeenCalledTimes(2);
  });

  it.each([
    { amountMinor: 0 }, { amountMinor: 99_999 }, { amountMinor: 100_001 },
    { amountMinor: NaN }, { amountMinor: 100_000.5 }, { currency: "USD" },
    { currency: "" }, { reference: "another_transaction" }, { reference: "" },
  ])("rejects mismatched successful provider data: %j", async (patch) => {
    vi.mocked(providers.verifyCharge).mockResolvedValue({ ...transaction, ...patch });
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
    expectNoAcceptance();
  });

  it.each([0, -1, NaN, 100_000.5])("rejects invalid stored amount %s", async (amountMinor) => {
    payment.amountMinor = amountMinor;
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
    expect(providers.verifyCharge).not.toHaveBeenCalled();
    expectNoAcceptance();
  });

  it("rejects refunded payments before querying the provider", async () => {
    payment.escrowStatus = "refunded";
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
    expect(providers.verifyCharge).not.toHaveBeenCalled();
    expectNoAcceptance();
  });

  it("keeps unsuccessful provider transactions pending", async () => {
    vi.mocked(providers.verifyCharge).mockResolvedValue({ ...transaction, success: false });
    expect((await confirmJobPayment({ jobId: job.id })).outcome).toBe("pending");
    expectNoAcceptance();
  });

  it("returns a retryable result for provider outage", async () => {
    vi.mocked(providers.verifyCharge).mockRejectedValue(new Error("outage"));
    expect(await confirmJobPayment({ reference: "ona_ref" })).toMatchObject({ outcome: "pending", retryable: true });
    expectNoAcceptance();
  });

  it.each([
    { jobId: "another-job" }, { reference: "mutated_ref" }, { expectedProvider: "paystack" },
  ])("rejects conflicting caller hints: %j", async (input) => {
    expect((await confirmJobPayment(input)).outcome).toBe("rejected");
    expect(providers.verifyCharge).not.toHaveBeenCalled();
    expectNoAcceptance();
  });

  it.each([
    { motoristId: "other" }, { repairProId: "other" }, { paymentId: "other" },
  ])("rejects wrong stored job association: %j", async (patch) => {
    job = { ...job, ...patch };
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
    expectNoAcceptance();
  });

  it("requires authentication and rejects another customer's payment", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({ ok: false, response: Response.json({}, { status: 401 }) });
    expect((await verifyPost(request({ reference: "ona_ref" }))).status).toBe(401);
    payment.motoristId = "someone-else";
    expect((await verifyPost(request({ reference: "ona_ref" }))).status).toBe(403);
    expectNoAcceptance();
    expect(providers.verifyCharge).not.toHaveBeenCalled();
  });
  it("retries an early webhook until checkout is bound", async () => {
    job.paymentReference = undefined;
    expect((await webhookPost(request({ event: "charge.completed", data: { tx_ref: "ona_ref" } }))).status).toBe(503);
    expectNoAcceptance();
    job.paymentReference = "ona_ref";
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("confirmed");
  });
  it("does not book a job when the atomic transition reports a stale conflict", async () => {
    vi.mocked(store.bookConfirmedJob).mockResolvedValue({ outcome: "conflict" });
    expect(await confirmJobPayment({ reference: "ona_ref" })).toMatchObject({ outcome: "pending", code: "job_conflict" });
  });
  it("never books an agreed job with released funds", async () => {
    payment.escrowStatus = "released";
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
    expectNoAcceptance();
  });

  it("ignores a client-selected provider and preserves verify receipt", async () => {
    const response = await verifyPost(request({ reference: "ona_ref", provider: "mock", transactionId: "forged" }));
    expect(response.status).toBe(200);
    expect((await response.json()).data.receipt).toMatchObject({ amountMinor: 100_000, currency: "NGN", status: "held" });
    expect(providers.verifyCharge).toHaveBeenCalledWith("ona_ref", "flutterwave", { strictProvider: true });
  });

  it.each(["held", "released", "release_pending", "pending_settlement"] as const)("preserves already-funded %s payments", async (escrowStatus) => {
    payment.escrowStatus = escrowStatus;
    job.status = "paid_booked";
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("already_confirmed");
    expect(store.bookConfirmedJob).toHaveBeenCalledTimes(1);
    expect(providers.verifyCharge).not.toHaveBeenCalled();
  });

  it("recovers booking after payment was held but job persistence failed", async () => {
    payment.escrowStatus = "held";
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("already_confirmed");
    expect(store.bookConfirmedJob).toHaveBeenCalledTimes(1);
    expect(providers.verifyCharge).not.toHaveBeenCalled();
  });

  it("does not book after refund wins a concurrent hold", async () => {
    vi.mocked(store.bookConfirmedJob).mockResolvedValue({ outcome: "refunded" });
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
    expect(store.bookConfirmedJob).toHaveBeenCalledTimes(1);
  });

  it("does not resurrect a job cancelled during provider verification", async () => {
    vi.mocked(providers.verifyCharge).mockImplementation(async () => {
      job.status = "cancelled";
      return transaction;
    });
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
    expect(store.bookConfirmedJob).not.toHaveBeenCalled();
  });

  it("rejects underpayments through reconciliation, release and compatibility entry points", async () => {
    vi.mocked(providers.verifyCharge).mockResolvedValue({ ...transaction, amountMinor: 10 });
    expect((await reconcileJobPayment(job)).status).toBe("agreed");
    expect(await releaseJobEscrow(job)).toMatchObject({ ok: false });
    expect(await markJobPaidFromReference("ona_ref")).toHaveProperty("error");
    expect(attemptProPayout).not.toHaveBeenCalled();
    expectNoAcceptance();
  });

  it("converges simultaneous webhook, manual, reconciliation and release attempts", async () => {
    let finish: (value: typeof transaction) => void = () => {};
    const gate = new Promise<typeof transaction>((resolve) => { finish = resolve; });
    vi.mocked(providers.verifyCharge).mockReturnValue(gate);
    const requests = [
      webhookPost(request({ event: "charge.completed", data: { tx_ref: "ona_ref" } })),
      verifyPost(request({ reference: "ona_ref" })),
      reconcileJobPayment(job), releaseJobEscrow(job),
    ];
    finish(transaction);
    await Promise.all(requests);
    expect(job.status).toBe("paid_booked");
    expect(job.statusHistory).toHaveLength(1);
    expect(payment.escrowStatus).toBe("held");
  });

  it("permits isolated local mock amounts, refuses mocks on deployed runtimes", async () => {
    payment.provider = "mock";
    vi.mocked(providers.verifyCharge).mockResolvedValue({ ...transaction, amountMinor: 0 });
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("confirmed");
    vi.mocked(providers.isProductionRuntime).mockReturnValue(true);
    expect((await confirmJobPayment({ reference: "ona_ref" })).outcome).toBe("rejected");
  });
});

describe("Flutterwave webhook", () => {
  const event = { event: "charge.completed", data: { tx_ref: "ona_ref", status: "successful", amount: 1000 } };
  it.each(["", "forged"])("refuses unauthenticated notifications: %s", async (secret) => {
    expect((await webhookPost(request(event, secret))).status).toBe(401);
    expect(store.loadConfirmationPayment).not.toHaveBeenCalled();
  });
  it("fails closed without configured secret", async () => {
    vi.stubEnv("FLUTTERWAVE_WEBHOOK_SECRET_HASH", "");
    expect((await webhookPost(request(event))).status).toBe(401);
    expectNoAcceptance();
  });
  it("confirms without any browser callback, independently verifies and deduplicates", async () => {
    expect((await webhookPost(request(event))).status).toBe(200);
    expect((await webhookPost(request(event))).status).toBe(200);
    expect(job.status).toBe("paid_booked");
    expect(providers.verifyCharge).toHaveBeenCalledTimes(1);
    expect(store.bookConfirmedJob).toHaveBeenCalledTimes(2);
  });
  it("does not trust successful notification data", async () => {
    vi.mocked(providers.verifyCharge).mockResolvedValue({ ...transaction, amountMinor: 0 });
    expect((await webhookPost(request(event))).status).toBe(200);
    expectNoAcceptance();
  });
  it("retries unknown payments and provider outages", async () => {
    vi.mocked(store.loadConfirmationPayment).mockResolvedValue(null);
    expect((await webhookPost(request(event))).status).toBe(503);
    vi.mocked(store.loadConfirmationPayment).mockResolvedValue(payment);
    vi.mocked(providers.verifyCharge).mockRejectedValue(new Error("unavailable"));
    expect((await webhookPost(request(event))).status).toBe(503);
  });
  it("rejects a payment from another ledger/provider and ignores non-charge events", async () => {
    payment.provider = "paystack";
    expect((await webhookPost(request(event))).status).toBe(200);
    expectNoAcceptance();
    expect((await webhookPost(request({ event: "transfer.completed", data: { id: 123, status: "SUCCESSFUL" } }))).status).toBe(200);
    expect(providers.verifyCharge).not.toHaveBeenCalled();
  });
});
