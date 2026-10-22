// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJobSweep } from "@/components/jobs/job-flow-screen/use-job-sweep";
import type { JobRecord } from "@/lib/jobs/types";

const clientMocks = vi.hoisted(() => ({
  apiExpireStaleBookedJobs: vi.fn(),
}));

vi.mock("@/lib/jobs/client", () => ({
  apiExpireStaleBookedJobs: clientMocks.apiExpireStaleBookedJobs,
}));

function makeJob(overrides: Partial<JobRecord> = {}): JobRecord {
  const now = new Date("2026-10-21T01:00:00.000Z").toISOString();
  return {
    id: "11111111-1111-4111-8111-111111111111",
    motoristId: "motorist-1",
    motoristName: "Ada",
    repairProId: "pro-1",
    repairProName: "Kunle",
    serviceType: "mechanic",
    problem: "Alternator check",
    photos: [],
    maxOffers: 6,
    locationLabel: "Ikeja",
    motoristLocation: { lat: 6.5, lng: 3.3 },
    status: "en_route",
    escrowStatus: "held",
    currency: "NGN",
    proBaseMajor: 12000,
    agreedMajor: 12000,
    offers: [],
    negotiateEndsAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    createdAt: now,
    updatedAt: now,
    statusHistory: [],
    ...overrides,
  };
}

describe("useJobSweep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T01:00:00.000Z"));
    vi.clearAllMocks();
    clientMocks.apiExpireStaleBookedJobs.mockResolvedValue({
      ok: true,
      data: { checked: 1, cancelled: 0, ids: [] },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("skips sweeps completely for terminal jobs without pending settlement", async () => {
    const load = vi.fn(async () => {});
    for (const status of ["cancelled", "expired", "released", "refunded"] as const) {
      const h = renderHook(() =>
        useJobSweep({
          job: makeJob({
            status,
            escrowStatus: status === "released" ? "released" : "refunded",
          }),
          authReady: true,
          isAuthenticated: true,
          load,
        }),
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(240_000);
      });
      h.unmount();
    }
    expect(clientMocks.apiExpireStaleBookedJobs).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  it("does not fire an immediate sweep on mount or non-overdue status transitions, and runs on the 180s interval", async () => {
    const load = vi.fn(async () => {});
    const h = renderHook(
      ({ job }) =>
        useJobSweep({
          job,
          authReady: true,
          isAuthenticated: true,
          load,
        }),
      { initialProps: { job: makeJob({ status: "paid_booked" }) } },
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(clientMocks.apiExpireStaleBookedJobs).not.toHaveBeenCalled();

    // Non-overdue status transition does not trigger an immediate sweep
    h.rerender({ job: makeJob({ status: "en_route" }) });
    await act(async () => {
      await Promise.resolve();
    });
    expect(clientMocks.apiExpireStaleBookedJobs).not.toHaveBeenCalled();

    // After 180s interval: executes backup sweep and reloads
    await act(async () => {
      await vi.advanceTimersByTimeAsync(180_000);
    });
    expect(clientMocks.apiExpireStaleBookedJobs).toHaveBeenCalledTimes(1);
    expect(clientMocks.apiExpireStaleBookedJobs).toHaveBeenCalledWith({
      source: "job-screen",
      trigger: "interval",
      urgent: false,
    });
    expect(load).toHaveBeenCalledWith("maintenance");
  });

  it("triggers an immediate urgent sweep and 45s interval for pending payout settlement, and skips load when cooldown-skipped", async () => {
    const load = vi.fn(async () => {});
    clientMocks.apiExpireStaleBookedJobs
      .mockResolvedValueOnce({
        ok: true,
        data: { checked: 1, cancelled: 0, ids: [] },
      })
      .mockResolvedValueOnce({
        ok: true,
        skipped: true,
        data: { checked: 0, cancelled: 0, ids: [] },
      });

    renderHook(() =>
      useJobSweep({
        job: makeJob({
          status: "satisfied",
          escrowStatus: "pending_settlement",
        }),
        authReady: true,
        isAuthenticated: true,
        load,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(clientMocks.apiExpireStaleBookedJobs).toHaveBeenCalledTimes(1);
    expect(clientMocks.apiExpireStaleBookedJobs).toHaveBeenLastCalledWith({
      source: "job-screen",
      trigger: "initial",
      urgent: true,
    });
    expect(load).toHaveBeenCalledTimes(1);

    // 45s tick: when coordinator returns skipped: true, load("maintenance") is not called again
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });
    expect(clientMocks.apiExpireStaleBookedJobs).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
