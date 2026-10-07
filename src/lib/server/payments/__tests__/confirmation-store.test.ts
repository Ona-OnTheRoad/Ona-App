import { beforeEach, describe, expect, it, vi } from "vitest";
import { bindJobCheckout, bookConfirmedJob, holdConfirmedPayment, loadConfirmationJob, loadConfirmationPayment } from "../confirmation-store";
import { rowToEscrow } from "../escrow-store";
import { rowToJob } from "@/lib/server/jobs/job-store/mappers";

vi.mock("@/lib/server/local-backup-trigger", () => ({ triggerBackupAfterPaymentChange: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => ({ from }) }));
let paymentRow: Record<string, unknown>;
let jobRow: Record<string, unknown>;
let events: unknown[];
let failWrite: boolean;
let failEvent: boolean;
const from = vi.fn((table: string) => {
  let patch: Record<string, unknown> | undefined;
  const filters: [string, unknown][] = [];
  const query = {
    select: () => query, order: () => query, limit: () => query,
    in: () => query,
    eq: (column: string, value: unknown) => { filters.push([column, value]); return query; },
    update: (value: Record<string, unknown>) => { patch = value; return query; },
    insert: async (event: unknown) => { if (failEvent) throw new Error("event unavailable"); events.push(event); return { error: null }; },
    maybeSingle: async () => {
      if (patch && failWrite) return { data: null, error: { message: "database unavailable" } };
      const row = table === "payments" ? paymentRow : jobRow;
      if (!filters.every(([key, value]) => row[key] === value)) return { data: null, error: null };
      if (patch) Object.assign(row, patch);
      return { data: { ...row }, error: null };
    },
  };
  return query;
});

beforeEach(() => {
  paymentRow = { id: "payment", request_id: "job", motorist_id: "customer", repair_pro_id: "pro",
    provider: "flutterwave", provider_ref: "ref", amount_kobo: 100000, currency: "NGN",
    escrow_status: "pending_payment", status: "pending", updated_at: "old" };
  jobRow = { id: "job", motorist_id: "customer", repair_pro_id: "pro", flow_status: "agreed",
    status: "requested", status_history: [], payment_reference: "ref", updated_at: "old" };
  events = [];
  failWrite = false;
  failEvent = false;
  from.mockClear();
});

describe("confirmation conditional persistence", () => {
  it("only books once across concurrent workers with the same stale snapshot", async () => {
    const job = rowToJob(jobRow);
    const payment = rowToEscrow(paymentRow);
    const results = await Promise.all([bookConfirmedJob(job, payment), bookConfirmedJob(job, payment)]);
    expect(results.every((result) => result?.status === "paid_booked")).toBe(true);
    expect(events).toHaveLength(1);
    expect(jobRow.status_history).toHaveLength(1);
  });
  it("does not overwrite a cancellation or new checkout", async () => {
    const job = rowToJob(jobRow);
    jobRow.flow_status = "cancelled";
    jobRow.updated_at = "new";
    expect((await bookConfirmedJob(job, rowToEscrow(paymentRow)))?.status).toBe("cancelled");
    expect(events).toHaveLength(0);
  });
  it.each(["released", "refunded", "pending_settlement"])("does not regress concurrent %s payment", async (state) => {
    const payment = rowToEscrow(paymentRow);
    paymentRow.escrow_status = state;
    paymentRow.updated_at = "new";
    const fresh = await holdConfirmedPayment(payment, { success: true, reference: "ref", amountMinor: 100000, currency: "NGN" });
    expect(fresh.escrowStatus).toBe(state);
    expect(paymentRow.escrow_status).toBe(state);
  });
  it("preserves unrelated job fields when booking", async () => {
    jobRow.motorist_location = { lat: 6, lng: 3 };
    jobRow.offers = [{ id: "offer" }];
    await bookConfirmedJob(rowToJob(jobRow), rowToEscrow(paymentRow));
    expect(jobRow.motorist_location).toEqual({ lat: 6, lng: 3 });
    expect(jobRow.offers).toEqual([{ id: "offer" }]);
    expect(jobRow.flow_status).toBe("paid_booked");
  });
  it.each(["paid_booked", "cancelled"])("checkout cannot overwrite concurrent %s", async (status) => {
    const previous = rowToJob(jobRow);
    jobRow.flow_status = status;
    expect(await bindJobCheckout(previous, { ...previous, paymentReference: "new-ref", updatedAt: "new" })).toBeNull();
    expect(jobRow.payment_reference).toBe("ref");
    expect(jobRow.flow_status).toBe(status);
  });
  it("binds only checkout fields for an unchanged agreed snapshot", async () => {
    const previous = rowToJob(jobRow);
    expect(await bindJobCheckout(previous, { ...previous, paymentReference: "new-ref", updatedAt: "new" })).toMatchObject({ paymentReference: "new-ref" });
    expect(jobRow.flow_status).toBe("agreed");
    expect(jobRow.payment_id).toBeNull();
  });
  it("does not hold a changed amount even if its timestamp stayed the same", async () => {
    const previous = rowToEscrow(paymentRow);
    paymentRow.amount_kobo = 1;
    expect(await holdConfirmedPayment(previous, { success: true, reference: "ref", amountMinor: 100000, currency: "NGN" })).toMatchObject({ amountMinor: 1, escrowStatus: "pending_payment" });
  });
  it("returns the durable booking even if its optional event fails", async () => {
    failEvent = true;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(await bookConfirmedJob(rowToJob(jobRow), rowToEscrow(paymentRow))).toMatchObject({ status: "paid_booked" });
      expect(jobRow.flow_status).toBe("paid_booked");
      expect(log).toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });
  it("requires durable writes rather than reporting memory success", async () => {
    failWrite = true;
    await expect(holdConfirmedPayment(rowToEscrow(paymentRow), {
      success: true, reference: "ref", amountMinor: 100000, currency: "NGN",
    })).rejects.toThrow("persist");
    await expect(bookConfirmedJob(rowToJob(jobRow), rowToEscrow(paymentRow))).rejects.toThrow("persist");
    expect(events).toHaveLength(0);
  });
  it("uses exact reference lookup, never prefix or another job fallback", async () => {
    expect(await loadConfirmationPayment({ reference: "ref-mutated", jobId: "job" })).toBeNull();
    expect(await loadConfirmationPayment({ reference: "ref" })).toMatchObject({ id: "payment" });
  });
  it("bypasses stale process cache when loading payment jobs", async () => {
    jobRow.flow_status = "cancelled";
    expect(await loadConfirmationJob("job")).toMatchObject({ status: "cancelled" });
  });
});
