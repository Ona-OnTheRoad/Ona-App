import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/server/idempotency-prune", () => ({ pruneIdempotentOps: vi.fn() }));
const adminConfigured = vi.fn(() => true);
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => adminConfigured() }));

import { pruneIdempotentOps } from "@/lib/server/idempotency-prune";
import { GET, POST } from "@/app/api/cron/prune-idempotent-ops/route";

const SECRET = "prune-test-secret";
const url = "http://localhost/api/cron/prune-idempotent-ops";
const request = (headers: HeadersInit = {}, target = url) => new Request(target, { headers });
const authed = () => request({ authorization: `Bearer ${SECRET}` });

beforeEach(() => {
  vi.clearAllMocks();
  adminConfigured.mockReturnValue(true);
  vi.stubEnv("CRON_SECRET", SECRET);
  vi.stubEnv("ONA_CRON_SECRET", "");
  vi.stubEnv("JOB_EXPIRE_SECRET", "");
  vi.mocked(pruneIdempotentOps).mockResolvedValue({
    ok: true,
    deleted: 3,
    cutoff: "2026-11-14T12:00:00.000Z",
  });
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("prune-idempotent-ops cron authorization", () => {
  it.each([
    ["no secret", request()],
    ["a wrong bearer", request({ authorization: "Bearer wrong" })],
    ["a near-miss header", request({ "x-cron-secret": SECRET.slice(0, -1) })],
    ["the secret in the query string", request({}, `${url}?secret=${SECRET}`)],
  ])("refuses %s and deletes nothing", async (_label, req) => {
    expect((await GET(req)).status).toBe(401);
    expect(pruneIdempotentOps).not.toHaveBeenCalled();
  });

  it("fails closed when no secret is configured, even locally", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    expect((await GET(authed())).status).toBe(401);
    expect(pruneIdempotentOps).not.toHaveBeenCalled();
  });

  it("accepts the x-cron-secret header", async () => {
    expect((await GET(request({ "x-cron-secret": SECRET }))).status).toBe(200);
  });
});

describe("prune-idempotent-ops cron run", () => {
  it("prunes and reports the deleted count and cutoff", async () => {
    const res = await GET(authed());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ok: true,
      data: { deleted: 3, cutoff: "2026-11-14T12:00:00.000Z" },
    });
    expect(pruneIdempotentOps).toHaveBeenCalledWith();
    expect(console.info).toHaveBeenCalledWith(
      "[cron/prune-idempotent-ops] deleted 3 rows created before 2026-11-14T12:00:00.000Z",
    );
  });

  it("POST runs the same prune", async () => {
    expect((await POST(authed())).status).toBe(200);
    expect(pruneIdempotentOps).toHaveBeenCalledTimes(1);
  });

  it("returns 503 no_db without Supabase admin config", async () => {
    adminConfigured.mockReturnValue(false);
    const res = await GET(authed());
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("no_db");
    expect(pruneIdempotentOps).not.toHaveBeenCalled();
  });

  it("returns 500 and logs when the delete fails", async () => {
    vi.mocked(pruneIdempotentOps).mockResolvedValue({ ok: false, error: "boom" });
    const res = await GET(authed());
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("prune_failed");
    expect(console.error).toHaveBeenCalledWith(
      "[cron/prune-idempotent-ops] delete failed: boom",
    );
  });
});
