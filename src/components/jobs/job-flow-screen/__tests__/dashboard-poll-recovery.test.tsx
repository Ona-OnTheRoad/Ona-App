// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useDashboardJobs } from "@/components/dashboard/use-dashboard-jobs";
const mocks = vi.hoisted(() => ({ list: vi.fn(), subscribe: vi.fn(), unsub: vi.fn() }));
vi.mock("@/lib/jobs/client", () => ({ apiListJobs: mocks.list, apiPairingSweep: vi.fn() }));
vi.mock("@/lib/supabase/app-api", () => ({ backendSubscribeJobs: mocks.subscribe }));
const job = { id: "job", repairProId: "pro", motoristId: "customer", problem: "Engine issue", status: "en_route" };
const ok = (jobs = [job]) => ({ ok: true, data: { jobs } });
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); mocks.subscribe.mockReturnValue(mocks.unsub); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

it("catches the initial timeout, clears loading, and recovers at the four-minute interval", async () => {
  mocks.list.mockRejectedValueOnce(new Error("Request timed out")).mockResolvedValue(ok());
  const h = renderHook(() => useDashboardJobs("pro"));
  await advance(0);
  expect(h.result.current.jobsLoading).toBe(false);
  await advance(240_000);
  expect(h.result.current.ongoing).toEqual([job]);
});

it("preserves the displayed jobs after background timeout or API error", async () => {
  mocks.list.mockResolvedValueOnce(ok()).mockRejectedValueOnce(new Error("Request timed out"))
    .mockResolvedValueOnce({ ok: false, message: "Unavailable" }).mockResolvedValue(ok([]));
  const h = renderHook(() => useDashboardJobs("pro")); await advance(0);
  await advance(240_000); expect(h.result.current.ongoing).toEqual([job]);
  await advance(240_000); expect(h.result.current.ongoing).toEqual([job]);
  await advance(240_000); expect(h.result.current.ongoing).toEqual([]);
});

it("coalesces realtime during a slow refresh and skips the follow-up on unmount", async () => {
  let resolve!: (value: ReturnType<typeof ok>) => void;
  mocks.list.mockReturnValueOnce(new Promise((done) => { resolve = done; })).mockResolvedValue(ok([]));
  const h = renderHook(() => useDashboardJobs("pro")); await advance(0);
  const changed = mocks.subscribe.mock.calls[0][1] as () => void;
  act(() => { changed(); }); await advance(150);
  act(() => { changed(); }); await advance(150);
  expect(mocks.list).toHaveBeenCalledTimes(1);
  await act(async () => { resolve(ok()); });
  expect(mocks.list).toHaveBeenCalledTimes(2);
  expect(h.result.current.ongoing).toEqual([]);
  h.unmount(); await advance(240_000);
  expect(mocks.list).toHaveBeenCalledTimes(2);
  expect(mocks.unsub).toHaveBeenCalledTimes(1);
});

it("ignores a stale user response after the dashboard changes account", async () => {
  let resolve!: (value: ReturnType<typeof ok>) => void;
  mocks.list.mockReturnValueOnce(new Promise((done) => { resolve = done; })).mockResolvedValue(ok([]));
  const h = renderHook(({ userId }) => useDashboardJobs(userId), { initialProps: { userId: "pro" } });
  await advance(0); h.rerender({ userId: "other-pro" }); await advance(0);
  await act(async () => { resolve(ok()); });
  expect(h.result.current.ongoing).toEqual([]);
});
