import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRecord } from "@/lib/jobs/types";
import { rowToJob } from "@/lib/server/jobs/job-store/mappers";
import { startJobEscrowPayment } from "@/lib/server/jobs/job-store/payments";
import { refreshCheckoutSnapshot } from "../checkout-snapshot";

const mocks = vi.hoisted(() => ({
  getJob: vi.fn(), loadJob: vi.fn(), bind: vi.fn(), createPayment: vi.fn(),
  loadPayment: vi.fn(), attach: vi.fn(), bankTransfer: vi.fn(),
}));
vi.mock("@/lib/server/jobs/job-store/reads", () => ({ getJob: mocks.getJob }));
vi.mock("../confirmation-store", () => ({
  loadConfirmationJob: mocks.loadJob, bindJobCheckout: mocks.bind,
  loadConfirmationPayment: mocks.loadPayment,
}));
vi.mock("../confirm-job-payment", () => ({
  confirmJobPayment: vi.fn(async () => ({ outcome: "rejected", message: "Payment not found" })),
}));
vi.mock("../escrow-store", () => ({
  createEscrowPayment: mocks.createPayment,
  supersedePendingPaymentsForRequest: vi.fn(),
}));
vi.mock("../providers", () => ({ createFlutterwaveBankTransfer: mocks.bankTransfer }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => false }));
vi.mock("@/lib/server/callout/store", () => ({
  getCalloutQuote: vi.fn(async () => ({ calloutStatus: "PENDING" })),
}));
vi.mock("@/lib/server/callout/quote", () => ({ attachCalloutToRequest: mocks.attach, lockCalloutQuote: vi.fn() }));
vi.mock("@/lib/server/callout/estimate", () => ({
  estimateCalloutQuote: vi.fn(async () => ({ calloutStatus: "NOT_ELIGIBLE", calloutEligible: false, calloutFee: 0 })),
}));

let durable: JobRecord;
const input = { jobId: "job", motoristId: "customer", email: "test@example.com",
  callbackUrl: "http://localhost:3000/payments/callback", provider: "flutterwave" };

beforeEach(() => {
  vi.clearAllMocks();
  durable = rowToJob({ id: "job", motorist_id: "customer", repair_pro_id: "pro",
    flow_status: "agreed", job_version: 6, updated_at: "2026-10-19T11:20:42Z",
    agreed_major: 5000, pricing_currency: "NGN", service_type: "mechanic",
    status_history: [{ status: "agreed", by: "motorist", at: "2026-10-19T11:20:42Z" }],
  });
  mocks.getJob.mockImplementation(async () => structuredClone(durable));
  mocks.loadJob.mockImplementation(async () => structuredClone(durable));
  mocks.attach.mockImplementation(async () => {
    durable = { ...durable, jobVersion: 7, updatedAt: "2026-10-19T11:23:17.836096+00:00" };
  });
  mocks.bankTransfer.mockResolvedValue({ ok: true, instructions: { accountNumber: "test-account" } });
  mocks.createPayment.mockImplementation(async (payment) => {
    mocks.loadPayment.mockResolvedValue({ requestId: "job", amountMinor: payment.amountMinor,
      currency: payment.currency, provider: payment.provider });
  });
  mocks.bind.mockImplementation(async (previous: JobRecord, next: JobRecord) => {
    if (previous.jobVersion !== durable.jobVersion || previous.updatedAt !== durable.updatedAt || durable.status !== "agreed") return null;
    durable = { ...next, jobVersion: (durable.jobVersion ?? 0) + 1 };
    return durable;
  });
});

describe("checkout preparation snapshot", () => {
  it("binds a pending-callout checkout using the version produced by its own classification", async () => {
    const result = await startJobEscrowPayment(input);
    expect(result).toMatchObject({ jobId: "job", useInAppBankTransfer: true });
    expect(mocks.bind).toHaveBeenCalledWith(expect.objectContaining({ jobVersion: 7,
      updatedAt: "2026-10-19T11:23:17.836096+00:00" }), expect.anything());
    expect(durable.paymentReference).toBeTruthy();
  });

  it.each([
    ["cancelled", { status: "cancelled" }],
    ["paid", { status: "paid_booked" }],
    ["price", { agreedMajor: 7000 }],
    ["customer", { motoristId: "other" }],
    ["pro", { repairProId: "other" }],
    ["currency", { currency: "USD" }],
    ["checkout", { paymentReference: "another-checkout" }],
  ] as [string, Partial<JobRecord>][])("stops before provider creation when preparation races a %s change", async (_label, change) => {
    mocks.attach.mockImplementation(async () => { durable = { ...durable, ...change }; });
    expect(await startJobEscrowPayment(input)).toEqual({
      error: "Job changed while preparing checkout. Check payment status before trying again.",
    });
    expect(mocks.bankTransfer).not.toHaveBeenCalled();
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });

  it("does not absorb a cancel/reopen cycle into the refreshed version", async () => {
    const previous = structuredClone(durable);
    durable.statusHistory.push({ status: "cancelled", by: "motorist", at: "later" });
    expect(await refreshCheckoutSnapshot(previous)).toBeNull();
  });

  it("fails closed when the refreshed job is missing", async () => {
    mocks.loadJob.mockResolvedValue(null);
    expect(await refreshCheckoutSnapshot(durable)).toBeNull();
  });

  it("preserves the conditional bind when cancellation arrives during provider I/O", async () => {
    mocks.bankTransfer.mockImplementation(async () => {
      durable = { ...durable, status: "cancelled", jobVersion: 8 };
      return { ok: true, instructions: { accountNumber: "test-account" } };
    });
    expect(await startJobEscrowPayment(input)).toEqual({
      error: "Job changed while checkout was being created. Check payment status before trying again.",
    });
    expect(durable.status).toBe("cancelled");
    expect(durable.paymentReference).toBeNull();
  });
});
