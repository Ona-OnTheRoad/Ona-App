// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearJobDiagnostics,
  jobDiagnosticsSnapshot,
  startJobDiagnostics,
  stopJobDiagnostics,
} from "@/lib/jobs/diagnostics/collector";
import {
  coordinateExpireStale,
  coordinatePairingSweep,
  EXPIRE_STALE_ROUTINE_COOLDOWN_MS,
  EXPIRE_STALE_STORAGE_KEY,
  EXPIRE_STALE_URGENT_COOLDOWN_MS,
  jobNeedsImmediateMaintenanceSweep,
  jobNeedsMaintenanceSweep,
  PAIRING_SWEEP_COOLDOWN_MS,
  resetMaintenanceCoordinatorForTests,
} from "@/lib/jobs/maintenance-coordinator";
import type { JobRecord } from "@/lib/jobs/types";

function makeJob(overrides: Partial<JobRecord> = {}): JobRecord {
  const now = new Date("2026-10-21T01:00:00.000Z").toISOString();
  return {
    id: "11111111-1111-4111-8111-111111111111",
    motoristId: "motorist-1",
    motoristName: "Ada",
    repairProId: "pro-1",
    repairProName: "Kunle",
    serviceType: "mechanic",
    problem: "Engine stalling",
    photos: [],
    maxOffers: 6,
    locationLabel: "Ikeja",
    motoristLocation: { lat: 6.5, lng: 3.3 },
    status: "en_route",
    escrowStatus: "held",
    currency: "NGN",
    proBaseMajor: 10000,
    agreedMajor: 10000,
    offers: [],
    negotiateEndsAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    createdAt: now,
    updatedAt: now,
    statusHistory: [],
    ...overrides,
  };
}

describe("maintenance-coordinator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T01:00:00.000Z"));
    resetMaintenanceCoordinatorForTests();
    stopJobDiagnostics();
    clearJobDiagnostics();
  });

  afterEach(() => {
    resetMaintenanceCoordinatorForTests();
    stopJobDiagnostics();
    clearJobDiagnostics();
    vi.useRealTimers();
  });

  it("coalesces concurrent in-flight expire-stale and pairing-sweep calls and records diagnostics", async () => {
    startJobDiagnostics();
    let resolveExpire!: (value: {
      ok: true;
      data: { checked: number; cancelled: number; ids: string[] };
    }) => void;
    const expireFetcher = vi.fn(
      () =>
        new Promise<{
          ok: true;
          data: { checked: number; cancelled: number; ids: string[] };
        }>((resolve) => {
          resolveExpire = resolve;
        }),
    );

    const p1 = coordinateExpireStale(
      { source: "cloud-store", trigger: "initial" },
      undefined,
      expireFetcher,
    );
    const p2 = coordinateExpireStale(
      { source: "job-screen", trigger: "initial" },
      undefined,
      expireFetcher,
    );

    expect(expireFetcher).toHaveBeenCalledTimes(1);
    resolveExpire({ ok: true, data: { checked: 3, cancelled: 1, ids: ["j1"] } });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({
      ok: true,
      data: { checked: 3, cancelled: 1, ids: ["j1"] },
    });
    expect(r2).toEqual({
      ok: true,
      coalesced: true,
      data: { checked: 3, cancelled: 1, ids: ["j1"] },
    });

    const events = jobDiagnosticsSnapshot().events;
    expect(events).toContainEqual(
      expect.objectContaining({
        kind: "refresh",
        resource: "expire-stale",
        source: "job-screen",
        outcome: "coalesced",
      }),
    );
  });

  it("enforces routine (120s) and urgent (45s) cooldowns across calls and tabs via localStorage", async () => {
    startJobDiagnostics();
    const fetcher = vi.fn(async () => ({
      ok: true as const,
      data: { checked: 2, cancelled: 0, ids: [] },
    }));

    const first = await coordinateExpireStale(
      { source: "cloud-store", trigger: "initial" },
      undefined,
      fetcher,
    );
    expect(first.ok && !first.skipped).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // 30s later: both routine and urgent calls are skipped
    vi.advanceTimersByTime(30_000);
    const skippedUrgent = await coordinateExpireStale(
      { source: "job-screen", trigger: "interval" },
      { urgent: true },
      fetcher,
    );
    expect(skippedUrgent).toEqual({
      ok: true,
      skipped: true,
      data: { checked: 0, cancelled: 0, ids: [] },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // 50s after first run (> 45s urgent cooldown, < 120s routine cooldown):
    // routine call is still skipped, but urgent call executes
    vi.advanceTimersByTime(20_000);
    const skippedRoutine = await coordinateExpireStale(
      { source: "cloud-store", trigger: "interval" },
      undefined,
      fetcher,
    );
    expect(skippedRoutine.ok && skippedRoutine.skipped).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);

    const urgentAllowed = await coordinateExpireStale(
      { source: "checkout", trigger: "maintenance" },
      { urgent: true },
      fetcher,
    );
    expect(urgentAllowed.ok && !urgentAllowed.skipped).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);

    // Simulate another browser tab writing a fresh timestamp to localStorage
    vi.advanceTimersByTime(EXPIRE_STALE_ROUTINE_COOLDOWN_MS + 1_000);
    window.localStorage.setItem(
      EXPIRE_STALE_STORAGE_KEY,
      String(Date.now() - 10_000),
    );
    const crossTabSkipped = await coordinateExpireStale(
      { source: "release", trigger: "maintenance" },
      undefined,
      fetcher,
    );
    expect(crossTabSkipped.ok && crossTabSkipped.skipped).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);

    // Advance past urgent cooldown from the cross-tab timestamp
    vi.advanceTimersByTime(EXPIRE_STALE_URGENT_COOLDOWN_MS);
    const afterCrossTabUrgent = await coordinateExpireStale(
      { source: "job-screen", trigger: "maintenance" },
      { urgent: true },
      fetcher,
    );
    expect(afterCrossTabUrgent.ok && !afterCrossTabUrgent.skipped).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("enforces 5s cooldown on pairing-sweep and does not lock out retries after failed runs", async () => {
    const pairingFetcher = vi
      .fn<
        () => Promise<
          | { ok: true; data: { checked: number; timedOut: number; expired: number } }
          | { ok: false; message: string }
        >
      >()
      .mockResolvedValueOnce({ ok: false, message: "Temporary failure" })
      .mockResolvedValue({
        ok: true,
        data: { checked: 1, timedOut: 1, expired: 0 },
      });

    const failed = await coordinatePairingSweep(
      { source: "job-screen", trigger: "maintenance" },
      undefined,
      pairingFetcher,
    );
    expect(failed.ok).toBe(false);

    // Immediate retry succeeds because failed run did not advance lastRunAt
    const retried = await coordinatePairingSweep(
      { source: "dashboard", trigger: "maintenance" },
      undefined,
      pairingFetcher,
    );
    expect(retried).toEqual({
      ok: true,
      data: { checked: 1, timedOut: 1, expired: 0 },
    });
    expect(pairingFetcher).toHaveBeenCalledTimes(2);

    // Within 5s cooldown: skipped
    vi.advanceTimersByTime(PAIRING_SWEEP_COOLDOWN_MS - 1_000);
    const skipped = await coordinatePairingSweep(
      { source: "dashboard", trigger: "maintenance" },
      undefined,
      pairingFetcher,
    );
    expect(skipped.ok && skipped.skipped).toBe(true);
    expect(pairingFetcher).toHaveBeenCalledTimes(2);
  });

  it("scopes jobNeedsMaintenanceSweep and jobNeedsImmediateMaintenanceSweep accurately", () => {
    expect(jobNeedsMaintenanceSweep(null)).toBe(false);
    expect(jobNeedsMaintenanceSweep(makeJob({ status: "cancelled" }))).toBe(false);
    expect(jobNeedsMaintenanceSweep(makeJob({ status: "expired" }))).toBe(false);
    expect(
      jobNeedsMaintenanceSweep(
        makeJob({ status: "released", escrowStatus: "released" }),
      ),
    ).toBe(false);
    expect(
      jobNeedsMaintenanceSweep(
        makeJob({ status: "released", escrowStatus: "pending_settlement" }),
      ),
    ).toBe(true);
    expect(jobNeedsMaintenanceSweep(makeJob({ status: "en_route" }))).toBe(true);

    // Non-overdue en_route job does not need an immediate mount sweep
    expect(
      jobNeedsImmediateMaintenanceSweep(makeJob({ status: "en_route" })),
    ).toBe(false);

    // Satisfied / pending_settlement jobs need immediate sweep
    expect(
      jobNeedsImmediateMaintenanceSweep(makeJob({ status: "satisfied" })),
    ).toBe(true);

    // Agreed job past 11m payment session deadline needs immediate sweep
    expect(
      jobNeedsImmediateMaintenanceSweep(
        makeJob({
          status: "agreed",
          escrowStatus: "pending_payment",
          statusHistory: [
            {
              status: "agreed",
              at: new Date(Date.now() - 12 * 60_000).toISOString(),
              by: "payment_session_start",
            },
          ],
          paymentSessionEndsAt: new Date(Date.now() - 5_000).toISOString(),
        }),
      ),
    ).toBe(true);
  });
});
