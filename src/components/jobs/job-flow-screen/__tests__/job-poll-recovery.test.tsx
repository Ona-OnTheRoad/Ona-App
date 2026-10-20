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

function draw(load = vi.fn(async () => {})) {
  const setErr = vi.fn();
  const hook = renderHook(({ snapshot }) => useJobPoll({ job: snapshot, authReady: true,
    isAuthenticated: true, actorId: "customer", load, setErr }), { initialProps: { snapshot: job } });
  return { ...hook, load, setErr };
}

describe("job poll recovery", () => {
  it.each([
    ["reserved", 1_000], ["negotiating", 8_000], ["agreed", 8_000],
    ["en_route", 15_000], ["completed", 15_000], ["released", 45_000], ["cancelled", 60_000],
  ] as const)("preserves the %s polling interval", async (status, ms) => {
    const h = draw(); await flush();
    h.rerender({ snapshot: { ...job, status } }); await flush();
    const calls = h.load.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(ms - 1); });
    expect(h.load).toHaveBeenCalledTimes(calls);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(h.load).toHaveBeenCalledTimes(calls + 1);
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

  it("catches a read failure and retries at the next interval", async () => {
    const h = draw(vi.fn().mockRejectedValueOnce(new Error("Request timed out"))
      .mockResolvedValue(undefined));
    await flush();
    expect(h.setErr).toHaveBeenCalledWith("Request timed out");
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(h.load).toHaveBeenCalledTimes(2);
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
      const loader = useJobLoad({ jobId: "job", router: router as never, accountType: "motorist",
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
