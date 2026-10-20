import { beforeEach, describe, expect, it, vi } from "vitest";
import { bindJobCheckout, bookConfirmedJob, loadConfirmationJob } from "../confirmation-store";
import { rowToEscrow } from "../escrow-store";
import { rowToJob } from "@/lib/server/jobs/job-store/mappers";

const { rpc, query } = vi.hoisted(() => {
  const mockQuery = { select: vi.fn(), eq: vi.fn(), update: vi.fn(), maybeSingle: vi.fn() };
  mockQuery.select.mockReturnValue(mockQuery);
  mockQuery.eq.mockReturnValue(mockQuery);
  mockQuery.update.mockReturnValue(mockQuery);
  return { rpc: vi.fn(), query: mockQuery };
});

describe("conditional checkout binding", () => {
  it("keeps the version, timestamp and agreed-state guards after snapshot refresh", async () => {
    query.maybeSingle.mockResolvedValue({ data: { ...jobRow, job_version: 8 }, error: null });
    const previous = rowToJob(jobRow);
    expect(await bindJobCheckout(previous, { ...previous, paymentReference: "new-ref" }))
      .toMatchObject({ jobVersion: 8 });
    expect(query.eq.mock.calls).toEqual([
      ["id", "job"], ["job_version", 7], ["flow_status", "agreed"], ["updated_at", "old"],
    ]);
  });

  it("does not retry a competing checkout's losing bind without its original guard", async () => {
    query.maybeSingle
      .mockResolvedValueOnce({ data: { ...jobRow, payment_reference: "winner", job_version: 8 }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const previous = rowToJob(jobRow);
    const [winner, loser] = await Promise.all([
      bindJobCheckout(previous, { ...previous, paymentReference: "winner" }),
      bindJobCheckout(previous, { ...previous, paymentReference: "loser" }),
    ]);
    expect(winner?.paymentReference).toBe("winner");
    expect(loser).toBeNull();
    expect(query.update).toHaveBeenCalledTimes(2);
    expect(query.eq.mock.calls.filter(([column]) => column === "job_version"))
      .toEqual([["job_version", 7], ["job_version", 7]]);
  });
});
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => ({ rpc, from: () => query }) }));

const paymentRow = { id: "payment", request_id: "job", motorist_id: "customer", repair_pro_id: "pro",
  provider: "flutterwave", provider_ref: "ref", amount_kobo: 100000, currency: "NGN",
  escrow_status: "pending_payment", status: "pending" };
const jobRow = { id: "job", motorist_id: "customer", repair_pro_id: "pro", flow_status: "agreed",
  status: "requested", status_history: [], payment_reference: "ref", updated_at: "old", job_version: 7 };

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: { outcome: "confirmed", job: { ...jobRow, flow_status: "paid_booked", status: "accepted" }, payment: { ...paymentRow, status: "paid", escrow_status: "held" } }, error: null });
});

describe("atomic payment booking persistence", () => {
  it("sends the verified obligation and snapshot version to one SQL transition", async () => {
    const job = rowToJob(jobRow);
    const payment = rowToEscrow(paymentRow);
    const verified = { success: true, reference: "ref", amountMinor: 100000, currency: "NGN" };
    const result = await bookConfirmedJob(job, payment, verified);
    expect(rpc).toHaveBeenCalledWith("apply_confirmed_job_payment", expect.objectContaining({
      p_payment_id: payment.id, p_request_id: job.id, p_expected_job_version: 7,
      p_provider_ref: "ref", p_verified_amount_kobo: 100000, p_verified_currency: "NGN",
    }));
    expect(result).toMatchObject({ outcome: "confirmed", job: { status: "paid_booked" }, payment: { escrowStatus: "held" } });
  });

  it("preserves explicit conflict outcomes for durable retry handling", async () => {
    rpc.mockResolvedValue({ data: { outcome: "conflict" }, error: null });
    const result = await bookConfirmedJob(rowToJob(jobRow), rowToEscrow(paymentRow), {
      success: true, reference: "ref", amountMinor: 100000, currency: "NGN",
    });
    expect(result).toEqual({ outcome: "conflict", job: undefined, payment: undefined });
  });

  it("fails closed when the transaction RPC is unavailable", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("database unavailable") });
    await expect(bookConfirmedJob(rowToJob(jobRow), rowToEscrow(paymentRow), {
      success: true, reference: "ref", amountMinor: 100000, currency: "NGN",
    })).rejects.toThrow("atomic payment booking");
  });

  it("loads the job directly from durable storage for race rechecks", async () => {
    query.maybeSingle.mockResolvedValue({ data: { ...jobRow, flow_status: "cancelled", status: "cancelled" }, error: null });
    expect(await loadConfirmationJob("job")).toMatchObject({ status: "cancelled" });
  });
});
