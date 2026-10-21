import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GET, POST } from "../route";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), job: vi.fn(), party: vi.fn(), quote: vi.fn() }));
vi.mock("@/lib/server/auth-utils", () => ({ requireUser: mocks.auth, isJobParty: mocks.party }));
vi.mock("@/lib/server/jobs/job-store", () => ({ getJob: mocks.job }));
vi.mock("@/lib/server/callout/resolve", () => ({ resolveJobCalloutQuote: mocks.quote }));
vi.mock("@/lib/server/structured-logger", () => ({ serverLogger: { warn: vi.fn(), error: vi.fn() } }));
const ctx = { params: Promise.resolve({ id: "private-job" }) };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ ok: true, userId: "private-user" });
  mocks.job.mockResolvedValue({ id: "private-job" }); mocks.party.mockReturnValue(true);
  mocks.quote.mockResolvedValue(null); vi.stubEnv("JOB_READ_TIMING_ENABLED", "false");
});
afterEach(() => vi.unstubAllEnvs());

it("leaves the default response free of timing metadata", async () => {
  const res = await GET(new Request("http://localhost/api/jobs/private-job"), ctx);
  expect(res.status).toBe(200); expect(res.headers.get("server-timing")).toBeNull();
});
it.each([GET, POST])("adds only safe numeric stage durations when explicitly enabled", async (handler) => {
  vi.stubEnv("JOB_READ_TIMING_ENABLED", "true");
  const res = await handler(new Request("http://localhost/api/jobs/private-job?access_token=secret", {
    method: handler === POST ? "POST" : "GET", ...(handler === POST ? { body: "{}" } : {}),
  }), ctx);
  expect(res.status).toBe(200);
  expect(res.headers.get("server-timing")).toMatch(/^auth;dur=\d+\.\d{2},job_load;dur=\d+\.\d{2},callout;dur=\d+\.\d{2}$/);
  expect(res.headers.get("server-timing")).not.toMatch(/private|secret/);
});
it("keeps auth and access checks before job data or quote resolution", async () => {
  vi.stubEnv("JOB_READ_TIMING_ENABLED", "true");
  mocks.auth.mockResolvedValueOnce({ ok: false, response: new Response(null, { status: 401 }) });
  const denied = await GET(new Request("http://localhost/api/jobs/private-job"), ctx);
  expect(denied.status).toBe(401); expect(mocks.job).not.toHaveBeenCalled();
  expect(denied.headers.get("server-timing")).toMatch(/^auth;/);
  mocks.party.mockReturnValue(false);
  expect((await GET(new Request("http://localhost/api/jobs/private-job"), ctx)).status).toBe(403);
  expect(mocks.quote).not.toHaveBeenCalled();
});
it("preserves failed read behavior and attaches the completed stages", async () => {
  vi.stubEnv("JOB_READ_TIMING_ENABLED", "true"); mocks.job.mockRejectedValue(new Error("unavailable"));
  const res = await GET(new Request("http://localhost/api/jobs/private-job"), ctx);
  expect(res.status).toBe(500); expect(res.headers.get("server-timing")).toContain("job_load;dur=");
});
