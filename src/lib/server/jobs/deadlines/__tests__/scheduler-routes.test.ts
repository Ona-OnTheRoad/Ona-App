import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireUser } from "@/lib/server/auth-utils";
import { hasSchedulerSecret } from "../scheduler-auth";
import { SweepBusyError } from "../sweep-lease";
import { sweepNegotiationDeadlines } from "../negotiation-expiry";
import { sweepPairing, sweepScheduledDispatches } from "@/lib/server/pairing/pairing-engine";
import { expireOverdueBookedJobs, expireUnacceptedJobs } from "@/lib/server/jobs/job-store";
import { processDuePayoutRetries } from "@/lib/server/payments/payout-settlement";
import { GET, POST } from "@/app/api/jobs/deadline-sweep/route";
import { POST as maintenance } from "@/app/api/jobs/expire-stale/route";
import { POST as pairingRecovery } from "@/app/api/jobs/pairing-sweep/route";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("../negotiation-expiry", () => ({ sweepNegotiationDeadlines: vi.fn() }));
vi.mock("@/lib/server/pairing/pairing-engine", () => ({ sweepPairing: vi.fn(), sweepScheduledDispatches: vi.fn() }));
vi.mock("@/lib/server/jobs/job-store", () => ({ expireOverdueBookedJobs: vi.fn(), expireUnacceptedJobs: vi.fn() }));
vi.mock("@/lib/server/payments/payout-settlement", () => ({ processDuePayoutRetries: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => false }));

const request = (headers: HeadersInit = {}) => new Request("http://localhost/api/jobs/deadline-sweep", { headers });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "scheduler-test-secret");
  vi.stubEnv("ONA_CRON_SECRET", "");
  vi.stubEnv("JOB_EXPIRE_SECRET", "");
  vi.mocked(requireUser).mockResolvedValue({ ok: false, response: Response.json({}, { status: 401 }) });
  vi.mocked(sweepPairing).mockResolvedValue({ checked: 1, timedOut: 1, expired: 0 });
  vi.mocked(sweepNegotiationDeadlines).mockResolvedValue({ checked: 1, expired: 1, batchFull: false });
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("scheduler authorization", () => {
  it.each([{}, { authorization: "Bearer wrong" }, { "x-cron-secret": "scheduler-test-secre" }])("fails closed for %j before any mutation", async (headers) => {
    expect((await GET(request(headers as HeadersInit))).status).toBe(401);
    expect(sweepPairing).not.toHaveBeenCalled();
    expect(sweepNegotiationDeadlines).not.toHaveBeenCalled();
  });
  it("never accepts a user token as scheduler authority", async () => {
    vi.mocked(requireUser).mockResolvedValue({ ok: true, userId: "customer", token: "user-token", user: {} } as Awaited<ReturnType<typeof requireUser>>);
    expect((await POST(request({ authorization: "Bearer user-token" }))).status).toBe(401);
    expect(requireUser).not.toHaveBeenCalled();
  });
  it("requires configuration even in local development", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(request())).status).toBe(401);
  });
  it.each(["CRON_SECRET", "JOB_EXPIRE_SECRET", "ONA_CRON_SECRET"])("accepts independently configured %s", (key) => {
    vi.stubEnv("CRON_SECRET", ""); vi.stubEnv(key, "other-secret");
    expect(hasSchedulerSecret(request({ authorization: "Bearer other-secret" }))).toBe(true);
    expect(hasSchedulerSecret(request({ "x-cron-secret": "other-secret" }))).toBe(true);
  });
  it("does not accept secrets from query strings", () => {
    expect(hasSchedulerSecret(new Request("http://localhost/?secret=scheduler-test-secret"))).toBe(false);
  });
});

describe("minute deadline route", () => {
  it("runs pairing and negotiations, without broad financial maintenance", async () => {
    const response = await POST(request({ authorization: "Bearer scheduler-test-secret" }));
    expect(response.status).toBe(200);
    expect((await response.json()).data.outcomes.negotiation).toMatchObject({ status: "completed", expired: 1 });
    expect(sweepPairing).toHaveBeenCalledWith(25);
    expect(sweepNegotiationDeadlines).toHaveBeenCalledWith(25);
    expect(expireOverdueBookedJobs).not.toHaveBeenCalled();
    expect(processDuePayoutRetries).not.toHaveBeenCalled();
    expect(sweepScheduledDispatches).not.toHaveBeenCalled();
  });
  it.each([new Error("private database error"), new SweepBusyError("busy")])("requests retry rather than claiming success for unavailable work", async (error) => {
    vi.mocked(sweepPairing).mockRejectedValue(error);
    const response = await GET(request({ "x-cron-secret": "scheduler-test-secret" }));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("private database error");
    expect(sweepNegotiationDeadlines).toHaveBeenCalled();
  });
});

describe("browser maintenance compatibility", () => {
  it("rejects unauthorized expire-stale before all sweep operations", async () => {
    expect((await maintenance(request())).status).toBe(401);
    for (const operation of [expireOverdueBookedJobs, expireUnacceptedJobs, sweepPairing, sweepScheduledDispatches, processDuePayoutRetries]) {
      expect(operation).not.toHaveBeenCalled();
    }
  });
  it("keeps authenticated browser pairing recovery", async () => {
    vi.mocked(requireUser).mockResolvedValue({ ok: true, userId: "customer" } as Awaited<ReturnType<typeof requireUser>>);
    expect((await pairingRecovery(request({ authorization: "Bearer user-token" }))).status).toBe(200);
    expect(sweepPairing).toHaveBeenCalled();
  });
});
