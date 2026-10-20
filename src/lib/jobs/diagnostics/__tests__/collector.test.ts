// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { beginJobDiagnostic, clearJobDiagnostics, jobDiagnosticsSnapshot, MAX_DIAGNOSTIC_EVENTS,
  recordJobDiagnostic, startJobDiagnostics, stopJobDiagnostics } from "../collector";
import { measureJobHttp } from "../measure";
const context = { source: "job-screen", trigger: "interval" } as const;
beforeEach(() => { stopJobDiagnostics(); clearJobDiagnostics(); });
afterEach(() => { stopJobDiagnostics(); vi.restoreAllMocks(); });

it("defaults off and does not inspect headers or consume a response body", async () => {
  const response = new Response("private job data");
  const get = vi.spyOn(response.headers, "get");
  const fetcher = vi.fn(async () => response);
  expect(await measureJobHttp("job", context, fetcher)).toBe(response);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(get).not.toHaveBeenCalled();
  expect(response.bodyUsed).toBe(false);
  expect(jobDiagnosticsSnapshot().retained).toBe(0);
});

it("retains only fixed labels and allowlisted finite numeric fields", () => {
  startJobDiagnostics();
  recordJobDiagnostic("http", "job", { ...context, token: "secret", jobId: "private" } as typeof context,
    "ok", { durationMs: 5, status: 200, bytes: Infinity, authMs: -1,
      url: "/api/jobs/private?token=secret", message: "phone/location" } as { durationMs: number });
  const sample = jobDiagnosticsSnapshot().events[0];
  expect(sample).toEqual(expect.objectContaining({ durationMs: 5, status: 200 }));
  expect(sample).not.toHaveProperty("bytes"); expect(sample).not.toHaveProperty("authMs");
  expect(JSON.stringify(jobDiagnosticsSnapshot())).not.toMatch(/secret|private|phone|location/);
  recordJobDiagnostic("http", "job", { source: "raw-secret", trigger: "interval" } as never, "ok");
  expect(jobDiagnosticsSnapshot().retained).toBe(1);
});

it("caps retention, reports dropped samples, and returns independent snapshots", () => {
  startJobDiagnostics("trip");
  for (let i = 0; i < MAX_DIAGNOSTIC_EVENTS + 7; i++) recordJobDiagnostic("trigger", "job", context, "skipped");
  const snapshot = jobDiagnosticsSnapshot();
  expect(snapshot).toMatchObject({ retained: 1000, dropped: 7, scenario: "trip" });
  snapshot.events[0].source = "other";
  expect(jobDiagnosticsSnapshot().events[0].source).toBe("job-screen");
  clearJobDiagnostics(); expect(jobDiagnosticsSnapshot().retained).toBe(0);
});

it("measures same-resource concurrency across sources without retaining a job identifier", () => {
  startJobDiagnostics();
  const one = beginJobDiagnostic("http", "job", context);
  const two = beginJobDiagnostic("http", "job", { source: "incoming", trigger: "realtime" });
  one("ok"); two("timeout"); two("ok");
  expect(jobDiagnosticsSnapshot().events.map((e) => [e.concurrent, e.outcome])).toEqual([[1, "ok"], [2, "timeout"]]);
  expect(jobDiagnosticsSnapshot().groups.find((g) => g.label.includes("incoming"))?.maxConcurrent).toBe(2);
});

it("does not allow an old read to contaminate a new or stopped capture", () => {
  startJobDiagnostics(); const old = beginJobDiagnostic("http", "job", context);
  startJobDiagnostics(); old("ok"); expect(jobDiagnosticsSnapshot().retained).toBe(0);
  const pending = beginJobDiagnostic("http", "job", context);
  stopJobDiagnostics(); const duration = jobDiagnosticsSnapshot().durationMs;
  pending("error"); expect(jobDiagnosticsSnapshot().retained).toBe(0);
  expect(jobDiagnosticsSnapshot().durationMs).toBe(duration);
});

it("includes event debounce in the response proxy and does not retime a read to a newer event", () => {
  let now = 0; vi.spyOn(performance, "now").mockImplementation(() => now);
  const realtime = { source: "job-screen", trigger: "realtime" } as const;
  startJobDiagnostics(); now = 10;
  recordJobDiagnostic("subscription", "jobs", realtime, "event");
  now = 30; const finish = beginJobDiagnostic("http", "job", realtime);
  now = 50; recordJobDiagnostic("subscription", "jobs", realtime, "event");
  now = 90; finish("ok");
  expect(jobDiagnosticsSnapshot().events.at(-1)).toMatchObject({ durationMs: 60, eventToResponseMs: 80 });
  expect(jobDiagnosticsSnapshot().groups.find((g) => g.label === "http/job-screen/job/realtime")?.p95EventToResponseMs).toBe(80);
});

it("extracts response metadata only, preserves response identity, and reports missing bytes as unknown", async () => {
  startJobDiagnostics();
  const response = new Response("secret body", { headers: {
    "content-length": "11", "server-timing": "auth;dur=4.5,job_load;dur=20,callout;dur=3",
    "x-private": "never record",
  } });
  expect(await measureJobHttp("job", context, async () => response)).toBe(response);
  expect(response.bodyUsed).toBe(false);
  expect(jobDiagnosticsSnapshot().events[0]).toMatchObject({ bytes: 11, authMs: 4.5, jobLoadMs: 20, calloutMs: 3 });
  await measureJobHttp("jobs", context, async () => new Response(null));
  expect(jobDiagnosticsSnapshot().groups.find((g) => g.label.includes("/jobs/"))?.knownBytes).toBeNull();
});

it("distinguishes HTTP failures, thrown failures and aborts without retaining raw error text", async () => {
  startJobDiagnostics();
  await measureJobHttp("job", context, async () => new Response(null, { status: 503 }));
  const aborted = new Error("secret token"); aborted.name = "AbortError";
  await expect(measureJobHttp("job", context, async () => { throw aborted; })).rejects.toBe(aborted);
  await expect(measureJobHttp("job", context, async () => { throw new Error("private data"); })).rejects.toThrow();
  expect(jobDiagnosticsSnapshot().events.map((e) => e.outcome)).toEqual(["http-error", "timeout", "error"]);
  expect(JSON.stringify(jobDiagnosticsSnapshot())).not.toMatch(/secret|private/);
});

it("exposes only a local explicit control surface", () => {
  expect(Object.keys(window.onaJobDiagnostics!)).toEqual(["start", "stop", "clear", "snapshot"]);
});
