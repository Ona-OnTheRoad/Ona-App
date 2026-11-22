// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRecord } from "@/lib/jobs/types";

const mocks = vi.hoisted(() => ({ list: vi.fn(), subscribe: vi.fn(), unsub: vi.fn() }));
vi.mock("@/lib/jobs/client", () => ({ apiListJobs: mocks.list, apiPairingSweep: vi.fn() }));
vi.mock("@/lib/supabase/app-api", () => ({ backendSubscribeJobs: mocks.subscribe }));

import { useDashboardJobs } from "@/components/dashboard/use-dashboard-jobs";
import { PayoutProcessingSection } from "@/components/dashboard/job-sections";
import {
  renderPayoutOnHoldStage,
  renderPendingSettlementStage,
} from "../closing-stages";
import { escrowReceiptLabel, JobCompleteBody } from "../job-complete-body";
import type { JobFlowCtx } from "../use-job-flow-controller";

const replace = vi.fn();
const ctx = { isLight: true, router: { replace }, ink: "text-ona-ink", muted: "text-ona-muted", calloutQuote: null } as unknown as JobFlowCtx;
const job = (over: Partial<JobRecord> = {}) =>
  ({
    id: "j1", status: "satisfied", repairProId: "pro", motoristId: "cust", problem: "Engine issue",
    agreedMajor: 20000, amountMinor: 2127000, currency: "NGN", escrowStatus: "payout_on_hold",
    statusHistory: [], ...over,
  }) as unknown as JobRecord;

beforeEach(() => { vi.clearAllMocks(); mocks.subscribe.mockReturnValue(mocks.unsub); });
afterEach(() => cleanup());

describe("Repair Pro payout screens", () => {
  it("on hold: says so plainly, shows the money, and nothing is spinning", () => {
    const { container } = render(<>{renderPayoutOnHoldStage(ctx, job())}</>);
    expect(screen.getAllByText("Payout on hold").length).toBeGreaterThan(0);
    expect(screen.getByText(/couldn.t complete your payout automatically/i)).toBeTruthy();
    expect(screen.getByText(/release it manually/i)).toBeTruthy();
    expect(screen.getByText(/Settings → Payments/)).toBeTruthy();
    // The breakdown stays consistent: ₦20,000 + ₦1,270 = ₦21,270.
    expect(screen.getByText("₦21,270")).toBeTruthy();
    expect(screen.getByText("₦1,270")).toBeTruthy();
    expect(container.querySelector(".animate-spin")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("pending: keeps the existing spinner screen and wording unchanged", () => {
    const { container } = render(<>{renderPendingSettlementStage(ctx, job({ escrowStatus: "pending_settlement" }))}</>);
    expect(screen.getAllByText("Payout processing").length).toBeGreaterThan(0);
    expect(screen.getByText(/Your payout is being processed automatically/)).toBeTruthy();
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });
});

describe("customer confirmation never mentions the payout queue", () => {
  const body = (viewer: "motorist" | "repair_pro", payoutPending: boolean, receiptOpen = false, escrowStatus = "pending_settlement") =>
    render(
      <JobCompleteBody
        job={job({ escrowStatus })}
        viewer={viewer}
        calloutQuote={null}
        payoutPending={payoutPending}
        hasRating={false}
        alreadyLeft={false}
        displayRating={0}
        displayNote=""
        rating={0}
        setRating={() => {}}
        receiptOpen={receiptOpen}
        setReceiptOpen={() => {}}
      />,
    );

  it("a customer whose payout is still queued sees a normal confirmation", () => {
    body("motorist", true);
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
    expect(screen.getByText(/your payment is confirmed and the job is closed/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/payout/i);
  });

  it("the receipt shows released, not an internal state, for the customer", () => {
    body("motorist", true, true, "payout_on_hold");
    expect(screen.getByText("Escrow released")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/pending_settlement|payout_on_hold|payout on hold/);
  });

  it("escrowReceiptLabel: customers never see queue states, nobody sees snake_case", () => {
    for (const e of ["pending_settlement", "release_pending", "payout_on_hold"]) {
      expect(escrowReceiptLabel("motorist", e)).toBe("released");
    }
    expect(escrowReceiptLabel("motorist", null)).toBe("released");
    expect(escrowReceiptLabel("motorist", "refunded")).toBe("refunded");
    expect(escrowReceiptLabel("repair_pro", "payout_on_hold")).toBe("payout on hold");
    expect(escrowReceiptLabel("repair_pro", "pending_settlement")).toBe("pending settlement");
  });
});

describe("Repair Pro dashboard", () => {
  const ok = (jobs: unknown[]) => ({ ok: true, data: { jobs } });
  const run = async (jobs: unknown[]) => {
    vi.useFakeTimers();
    mocks.list.mockResolvedValue(ok(jobs));
    const h = renderHook(() => useDashboardJobs("pro"));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    vi.useRealTimers();
    return h.result.current;
  };

  it("lists a pending AND an on-hold payout under 'Payment processing', never under finished jobs", async () => {
    const pending = job({ id: "p", escrowStatus: "pending_settlement" });
    const hold = job({ id: "h", escrowStatus: "payout_on_hold" });
    const paid = job({ id: "r", escrowStatus: "released", status: "released", releasedAt: "2026-11-22" });
    const r = await run([pending, hold, paid]);
    expect(r.payoutProcessing.map((j) => j.id).sort()).toEqual(["h", "p"]);
    expect(r.recent.map((j) => j.id)).toEqual(["r"]);
  });

  it("labels each row honestly: pending vs on hold", () => {
    const row = (id: string, esc: string) =>
      job({ id, escrowStatus: esc, locationLabel: "12 Allen Avenue, Ikeja" });
    render(
      <PayoutProcessingSection
        payoutProcessing={[row("p", "pending_settlement"), row("h", "payout_on_hold")]}
        ink="text-ona-ink"
        muted="text-ona-muted"
      />,
    );
    const rows = screen.getAllByRole("listitem").map((li) => li.textContent || "");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Payout pending");
    expect(rows[1]).toContain("Payout on hold");
    expect(rows[1]).not.toContain("Payout pending");
  });
});
