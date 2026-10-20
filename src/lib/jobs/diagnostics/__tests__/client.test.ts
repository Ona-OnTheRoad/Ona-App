// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiGetJob, apiListJobs } from "@/lib/jobs/client";
import { clearJobDiagnostics, jobDiagnosticsSnapshot, startJobDiagnostics, stopJobDiagnostics } from "../collector";
vi.mock("@/lib/supabase/session", () => ({ ensureAppSession: vi.fn(async () => ({ accessToken: "secret-token" })), SESSION_RELOGIN_MESSAGE: "Sign in" }));
beforeEach(() => { stopJobDiagnostics(); clearJobDiagnostics(); vi.useFakeTimers(); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); stopJobDiagnostics(); });
it("adds no requests or timers when enabled and attributes real fetches to their source", async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { jobs: [] } })));
  vi.stubGlobal("fetch", fetch);
  await apiListJobs("private-user", "repair_pro", { diagnostic: { source: "dashboard", trigger: "initial" } });
  expect(jobDiagnosticsSnapshot().retained).toBe(0); expect(vi.getTimerCount()).toBe(0);
  startJobDiagnostics();
  await apiListJobs("private-user", "repair_pro", { diagnostic: { source: "dashboard", trigger: "interval" } });
  expect(fetch).toHaveBeenCalledTimes(2); expect(vi.getTimerCount()).toBe(0);
  expect(jobDiagnosticsSnapshot().events).toEqual([expect.objectContaining({ kind: "http", resource: "jobs", source: "dashboard", trigger: "interval", outcome: "ok" })]);
  expect(JSON.stringify(jobDiagnosticsSnapshot())).not.toMatch(/private-user|secret-token/);
});
it("counts the existing 401 retry separately without adding a retry", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, data: { job: { id: "private-job" } } }))));
  startJobDiagnostics();
  expect((await apiGetJob("private-job", { source: "job-screen", trigger: "realtime" })).ok).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(jobDiagnosticsSnapshot().events.map((e) => [e.trigger, e.outcome])).toEqual([["realtime", "http-error"], ["retry", "ok"]]);
  expect(JSON.stringify(jobDiagnosticsSnapshot())).not.toMatch(/private-job|secret-token/);
});
