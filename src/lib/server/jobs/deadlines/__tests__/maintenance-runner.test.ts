import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FAMILY_MIN_INTERVAL_MS,
  resetMaintenanceRunnerForTests,
  runCoalescedPairingRecovery,
  runMaintenanceFamily,
} from "../maintenance-runner";

describe("maintenance-runner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T01:00:00.000Z"));
    resetMaintenanceRunnerForTests();
  });

  afterEach(() => {
    resetMaintenanceRunnerForTests();
    vi.useRealTimers();
  });

  it("coalesces concurrent in-flight runs and throttles repeated browser calls within the family interval", async () => {
    let resolveOp!: (value: { checked: number }) => void;
    const op = vi.fn(
      () =>
        new Promise<{ checked: number }>((resolve) => {
          resolveOp = resolve;
        }),
    );

    const p1 = runMaintenanceFamily("jobDeadlines", op, {
      throttledValue: { checked: 0 },
    });
    const p2 = runMaintenanceFamily("jobDeadlines", op, {
      throttledValue: { checked: 0 },
    });

    expect(op).toHaveBeenCalledTimes(1);
    resolveOp({ checked: 5 });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({
      value: { checked: 5 },
      throttled: false,
      coalesced: false,
    });
    expect(r2).toEqual({
      value: { checked: 5 },
      throttled: false,
      coalesced: true,
    });

    // Repeated call inside minimum interval is throttled
    vi.advanceTimersByTime(FAMILY_MIN_INTERVAL_MS.jobDeadlines - 1_000);
    const throttled = await runMaintenanceFamily("jobDeadlines", op, {
      throttledValue: { checked: 0 },
    });
    expect(throttled).toEqual({
      value: { checked: 0 },
      throttled: true,
      coalesced: false,
    });
    expect(op).toHaveBeenCalledTimes(1);

    // Scheduler bypassThrottle executes even inside the browser interval
    const bypassed = await runMaintenanceFamily(
      "jobDeadlines",
      async () => ({ checked: 2 }),
      { bypassThrottle: true, throttledValue: { checked: 0 } },
    );
    expect(bypassed).toEqual({
      value: { checked: 2 },
      throttled: false,
      coalesced: false,
    });
  });

  it("does not throttle retry after a failed family run and coalesces pairing recovery", async () => {
    const op = vi
      .fn<() => Promise<{ checked: number }>>()
      .mockRejectedValueOnce(new Error("db error"))
      .mockResolvedValueOnce({ checked: 3 });

    await expect(
      runMaintenanceFamily("unaccepted", op, {
        throttledValue: { checked: 0 },
      }),
    ).rejects.toThrow("db error");

    const retry = await runMaintenanceFamily("unaccepted", op, {
      throttledValue: { checked: 0 },
    });
    expect(retry.value).toEqual({ checked: 3 });
    expect(op).toHaveBeenCalledTimes(2);

    let resolvePairing!: (value: {
      checked: number;
      timedOut: number;
      expired: number;
    }) => void;
    const pairingOp = vi.fn(
      () =>
        new Promise<{ checked: number; timedOut: number; expired: number }>(
          (resolve) => {
            resolvePairing = resolve;
          },
        ),
    );
    const c1 = runCoalescedPairingRecovery(pairingOp);
    const c2 = runCoalescedPairingRecovery(pairingOp);
    expect(pairingOp).toHaveBeenCalledTimes(1);
    resolvePairing({ checked: 2, timedOut: 1, expired: 0 });
    await expect(Promise.all([c1, c2])).resolves.toEqual([
      { checked: 2, timedOut: 1, expired: 0 },
      { checked: 2, timedOut: 1, expired: 0 },
    ]);
  });
});
