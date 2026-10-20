// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRecord } from "@/lib/jobs/types";
import { useJobPoll } from "../use-job-poll";
import { useJobLoad } from "../use-job-load";
import { useJobFlowState } from "../use-job-flow-state";

const mocks = vi.hoisted(() => ({ get: vi.fn(), subscribe: vi.fn(), unsub: vi.fn() }));
vi.mock("@/lib/jobs/client", () => ({ apiGetJob: mocks.get }));
vi.mock("@/lib/supabase/session", () => ({ ensureAppSession: vi.fn(async () => null) }));
vi.mock("@/lib/supabase/app-api", () => ({ backendSubscribeJobs: mocks.subscribe }));
const job = { id: "job", status: "en_route", updatedAt: "now" } as JobRecord;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
};
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  mocks.subscribe.mockReturnValue(mocks.unsub);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

function draw(load = vi.fn(async () => {}), backoffJitterRatio = 0) {
  const setErr = vi.fn();
  const hook = renderHook(({ snapshot }) => useJobPoll({ job: snapshot, authReady: true,
    isAuthenticated: true, actorId: "customer", load, setErr, backoffJitterRatio }), { initialProps: { snapshot: job } });
  return { ...hook, load, setErr };
}

describe("job poll recovery", () => {
  it.each([
    ["reserved", 1_000], ["negotiating", 8_000], ["agreed", 8_000],
    ["en_route", 15_000], ["completed", 15_000], ["released", 45_000], ["cancelled", 60_000],
  ] as const)("preserves the %s polling interval when realtime is not yet connected", async (status, ms) => {
    const h = draw(); await flush();
    h.rerender({ snapshot: { ...job, status } }); await flush();
    const calls = h.load.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(ms - 1); });
    expect(h.load).toHaveBeenCalledTimes(calls);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(h.load).toHaveBeenCalledTimes(calls + 1);
  });

  it.each([
    ["reserved", 10_000], ["negotiating", 30_000], ["agreed", 30_000],
    ["en_route", 45_000], ["completed", 45_000], ["released", 120_000], ["cancelled", 180_000],
  ] as const)("shifts %s to the %dms safety interval once realtime is SUBSCRIBED and reverts when degraded", async (status, healthyMs) => {
    const h = draw(); await flush();
    h.rerender({ snapshot: { ...job, status } }); await flush();
    const onStatus = mocks.subscribe.mock.calls.at(-1)![3] as (
      state: "connecting" | "connected" | "reconnecting" | "failed",
      meta: { reconnected: boolean; hadPriorConnection: boolean },
    ) => void;
    act(() => {
      onStatus("connected", { reconnected: false, hadPriorConnection: false });
    });
    const calls = h.load.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(healthyMs - 1); });
    expect(h.load).toHaveBeenCalledTimes(calls);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(h.load).toHaveBeenCalledTimes(calls + 1);

    // Degrade to reconnecting -> immediately shifts back to fast degraded interval
    act(() => {
      onStatus("reconnecting", { reconnected: false, hadPriorConnection: true });
    });
    // Subsequent reconnect triggers an immediate reconciliation read
    act(() => {
      onStatus("connected", { reconnected: true, hadPriorConnection: true });
    });
    await flush();
    expect(h.load).toHaveBeenCalledTimes(calls + 2);
  });

  it("reconciles on browser online and visibility return, and drops to degraded cadence while offline", async () => {
    const h = draw(); await flush();
    const onStatus = mocks.subscribe.mock.calls.at(-1)![3] as (
      state: "connecting" | "connected" | "reconnecting" | "failed",
      meta: { reconnected: boolean; hadPriorConnection: boolean },
    ) => void;
    act(() => {
      onStatus("connected", { reconnected: false, hadPriorConnection: false });
    });
    expect(h.load).toHaveBeenCalledTimes(1);

    // Go offline -> shifts from 45s healthy to 15s degraded interval for en_route
    act(() => { window.dispatchEvent(new Event("offline")); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(h.load).toHaveBeenCalledTimes(2);

    // Return online -> immediate reconciliation read
    act(() => { window.dispatchEvent(new Event("online")); });
    await flush();
    expect(h.load).toHaveBeenCalledTimes(3);
  });

  it("queues a readiness reconciliation when SUBSCRIBED arrives while initial fetch is in flight", async () => {
    const first = deferred();
    const h = draw(vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(undefined));
    await flush();
    expect(h.load).toHaveBeenCalledTimes(1);
    const onStatus = mocks.subscribe.mock.calls.at(-1)![3] as (
      state: "connecting" | "connected" | "reconnecting" | "failed",
      meta: { reconnected: boolean; hadPriorConnection: boolean },
    ) => void;
    // SUBSCRIBED arrives while initial read is still in flight
    act(() => {
      onStatus("connected", { reconnected: false, hadPriorConnection: false });
    });
    expect(h.load).toHaveBeenCalledTimes(1);
    await act(async () => { first.resolve(); });
    // Follow-up reconciliation ran once initial read settled
    expect(h.load).toHaveBeenCalledTimes(2);
  });

  it("does not reload or resubscribe when a same-status snapshot is replaced", async () => {
    const h = draw(); await flush();
    h.rerender({ snapshot: { ...job, updatedAt: "later" } }); await flush();
    expect(h.load).toHaveBeenCalledTimes(1);
    expect(mocks.subscribe).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(h.load).toHaveBeenCalledTimes(2);
  });

  it("skips overlapping interval reads and coalesces realtime into one follow-up", async () => {
    const read = deferred();
    const h = draw(vi.fn().mockReturnValueOnce(read.promise).mockResolvedValue(undefined));
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(45_000); });
    expect(h.load).toHaveBeenCalledTimes(1);
    const onChange = mocks.subscribe.mock.calls[0][1] as () => void;
    act(() => { onChange(); onChange(); });
    await act(async () => { read.resolve(); });
    expect(h.load).toHaveBeenCalledTimes(2);
  });

  it("catches read failures, applies bounded exponential backoff, and resets cadence after recovery", async () => {
    const h = draw(
      vi.fn()
        .mockRejectedValueOnce(new Error("Request timed out"))
        .mockRejectedValueOnce(new Error("Request timed out"))
        .mockResolvedValue(undefined),
      0,
    );
    await flush();
    expect(h.setErr).toHaveBeenCalledWith("Request timed out");

    // 1st failure on en_route (base 15s) -> backs off to 30s (15s * 2^1)
    await act(async () => { await vi.advanceTimersByTimeAsync(29_999); });
    expect(h.load).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(h.load).toHaveBeenCalledTimes(2);

    // 2nd failure -> backs off to 60s (15s * 2^2, capped at 60s)
    await act(async () => { await vi.advanceTimersByTimeAsync(59_999); });
    expect(h.load).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(h.load).toHaveBeenCalledTimes(3);

    // 3rd call succeeded -> backoff resets to 15s base
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(h.load).toHaveBeenCalledTimes(4);
  });

  it("does not run a queued realtime follow-up after unmount", async () => {
    const read = deferred();
    const h = draw(vi.fn().mockReturnValue(read.promise)); await flush();
    const onChange = mocks.subscribe.mock.calls[0][1] as () => void;
    act(() => { onChange(); }); h.unmount();
    await act(async () => { read.resolve(); });
    expect(h.load).toHaveBeenCalledTimes(1);
  });

  it("pauses hidden-tab interval reads and cleans up its subscription/timer", async () => {
    const h = draw(); await flush();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(h.load).toHaveBeenCalledTimes(1);
    hidden.mockRestore(); h.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(h.load).toHaveBeenCalledTimes(1);
    expect(mocks.unsub).toHaveBeenCalledTimes(1);
  });
});

describe("shared job loader", () => {
  it("shares an in-flight read, keeps the existing job on timeout, and recovers", async () => {
    let reject!: (reason: Error) => void;
    mocks.get.mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }))
      .mockResolvedValue({ ok: true, data: { job } });
    const commitJob = vi.fn();
    const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
    const h = renderHook(() => {
      const s = useJobFlowState("job");
      const loader = useJobLoad({ jobId: "job", backendUserId: "customer", isAuthenticated: true, router: router as never, accountType: "motorist",
        notifRef: { current: null }, commitJob, s });
      return { ...loader, s };
    });
    let first!: Promise<void>;
    act(() => { h.result.current.s.setJob(job); first = h.result.current.load(); });
    await flush();
    expect(h.result.current.load()).toBe(first);
    expect(mocks.get).toHaveBeenCalledTimes(1);
    await act(async () => { reject(new Error("Request timed out")); await first; });
    expect(h.result.current.s.job).toBe(job);
    expect(h.result.current.s.err).toBe("Request timed out");
    await act(async () => { await h.result.current.load(); });
    expect(commitJob).toHaveBeenCalledWith(job);
    expect(h.result.current.s.err).toBeNull();
  });
});
