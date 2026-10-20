// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useJobPoll } from "@/components/jobs/job-flow-screen/use-job-poll";
import type { JobRecord } from "@/lib/jobs/types";
import { jobDiagnosticsSnapshot, recordJobDiagnostic, startJobDiagnostics, stopJobDiagnostics } from "../collector";
import { measureJobHttp, type JobTrigger } from "../measure";
const subscription = vi.hoisted(() => ({ subscribe: vi.fn(), unsub: vi.fn() }));
vi.mock("@/lib/supabase/app-api", () => ({ backendSubscribeJobs: subscription.subscribe }));
afterEach(() => { cleanup(); vi.useRealTimers(); stopJobDiagnostics(); vi.clearAllMocks(); });

it("attributes a controlled trip scenario without altering traffic or timers when diagnostics are enabled", async () => {
  vi.useFakeTimers(); subscription.subscribe.mockReturnValue(subscription.unsub);
  const job = { id: "private-job", status: "en_route" } as JobRecord;
  const requests = vi.fn(async () => new Response(null));
  const load = (trigger: JobTrigger = "unknown") => measureJobHttp("job", { source: "job-screen", trigger }, requests).then(() => {});
  const setErr = vi.fn();
  const run = async () => {
    const h = renderHook(({ snapshot }) => useJobPoll({ job: snapshot, actorId: "private-user", authReady: true,
      isAuthenticated: true, load, setErr }), { initialProps: { snapshot: job } });
    await act(async () => { await Promise.resolve(); });
    for (let n = 0; n < 10; n++) h.rerender({ snapshot: { ...job } });
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    const onChange = subscription.subscribe.mock.calls.at(-1)![1] as () => void;
    await act(async () => {
      recordJobDiagnostic("subscription", "jobs", { source: "job-screen", trigger: "realtime" }, "event");
      onChange(); await Promise.resolve();
    });
    const timers = vi.getTimerCount(); h.unmount();
    return timers;
  };
  const offTimers = await run(); const offCalls = requests.mock.calls.length;
  startJobDiagnostics("trip"); const onTimers = await run();
  expect(offCalls).toBe(4); expect(requests).toHaveBeenCalledTimes(8); expect(onTimers).toBe(offTimers);
  const snapshot = jobDiagnosticsSnapshot();
  expect(snapshot.events.filter((e) => e.kind === "http").map((e) => e.trigger)).toEqual(["initial", "interval", "interval", "realtime"]);
  expect(snapshot.groups.find((g) => g.label === "http/job-screen/job/realtime")?.p95EventToResponseMs).toEqual(expect.any(Number));
  expect(setErr).not.toHaveBeenCalled(); expect(JSON.stringify(snapshot)).not.toMatch(/private/);
});
