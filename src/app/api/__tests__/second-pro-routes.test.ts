import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/jobs/job-store", () => ({
  getJob: vi.fn(),
  createJob: vi.fn(),
  listJobsForUser: vi.fn(),
  expireOverdueBookedJobs: vi.fn(),
  expireUnacceptedJobs: vi.fn(),
  resetZombieFlowStatuses: vi.fn(async () => 0),
  dispatchScheduledSecondPro: vi.fn(),
}));

vi.mock("@/lib/server/pairing/pairing-engine", () => ({
  sweepPairing: vi.fn(async () => ({ checked: 0, timedOut: 0, expired: 0 })),
  sweepScheduledDispatches: vi.fn(async () => ({
    checked: 0,
    cancelled: 0,
    notified: 0,
  })),
  advancePairing: vi.fn(async () => {}),
}));

vi.mock("@/lib/server/payments/payout-settlement", () => ({
  processDuePayoutRetries: vi.fn(async () => ({
    checked: 0,
    succeeded: 0,
    stillPending: 0,
    failed: 0,
    ids: [],
  })),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  getJob,
  createJob,
  expireOverdueBookedJobs,
  expireUnacceptedJobs,
  dispatchScheduledSecondPro,
} from "@/lib/server/jobs/job-store";
import {
  sweepPairing,
  sweepScheduledDispatches,
  advancePairing,
} from "@/lib/server/pairing/pairing-engine";
import { processDuePayoutRetries } from "@/lib/server/payments/payout-settlement";

import { POST as postDispatchScheduled } from "@/app/api/jobs/[id]/dispatch-scheduled/route";
import { POST as postCreate } from "@/app/api/jobs/route";
import { GET as getExpireStale } from "@/app/api/jobs/expire-stale/route";
import type { JobRecord } from "@/lib/jobs/types";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const getJobMock = vi.mocked(getJob);
const createJobMock = vi.mocked(createJob);
const advancePairingMock = vi.mocked(advancePairing);
const dispatchScheduledSecondProMock = vi.mocked(dispatchScheduledSecondPro);

const SCHEDULED_JOB = {
  id: "tow-1",
  motoristId: "motorist-1",
  status: "scheduled",
  flowStatus: "scheduled",
  pairingRadiusKm: 5,
  statusHistory: [
    { status: "scheduled", at: "2026-08-17T00:00:00.000Z", by: "motorist" },
  ],
} as unknown as JobRecord;

const DISPATCHED_JOB = {
  ...SCHEDULED_JOB,
  status: "requested",
  flowStatus: "sequential_pairing",
  pickup_address: "Near the mall",
} as unknown as JobRecord;

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return {
    ok: true,
    userId,
    email: null,
    token: "t",
    user: {} as never,
  };
}

function dispatchReq(body: unknown) {
  return new Request("http://localhost/api/jobs/tow-1/dispatch-scheduled", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

function createReq(body: unknown) {
  return new Request("http://localhost/api/jobs", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

function params(id = "tow-1") {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
  advancePairingMock.mockResolvedValue({} as never);
  vi.mocked(sweepPairing).mockResolvedValue({
    checked: 0,
    timedOut: 0,
    expired: 0,
  });
  vi.mocked(sweepScheduledDispatches).mockResolvedValue({
    checked: 0,
    cancelled: 0,
    notified: 0,
  });
  vi.mocked(processDuePayoutRetries).mockResolvedValue({
    checked: 0,
    succeeded: 0,
    stillPending: 0,
    failed: 0,
    ids: [],
  });
});

describe("POST /api/jobs/[id]/dispatch-scheduled", () => {
  it("dispatches a scheduled linked request into sequential_pairing and books", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getJobMock
      .mockResolvedValueOnce(SCHEDULED_JOB)
      .mockResolvedValueOnce(DISPATCHED_JOB);
    dispatchScheduledSecondProMock.mockResolvedValue({ ok: true });

    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "Near the mall", lat: 6.5244, lng: 3.3792 }),
      params(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.job.id).toBe("tow-1");

    expect(dispatchScheduledSecondProMock).toHaveBeenCalledWith(
      SCHEDULED_JOB,
      { locationLabel: "Near the mall", lat: 6.5244, lng: 3.3792 },
    );
    expect(advancePairingMock).toHaveBeenCalledWith("tow-1");
  });

  it("rejects unauthenticated requests", async () => {
    requireUserMock.mockResolvedValue({
      ok: false,
      response: new Response(
        JSON.stringify({ ok: false, error: { message: "Unauthorized" } }),
        { status: 401 },
      ),
    });
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "x", lat: 1, lng: 2 }),
      params(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects dispatching another motorist's request (403)", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));
    getJobMock.mockResolvedValueOnce(SCHEDULED_JOB);
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "x", lat: 1, lng: 2 }),
      params(),
    );
    expect(res.status).toBe(403);
  });

  it("rejects a request that already left the scheduled state (409)", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getJobMock.mockResolvedValueOnce({ ...SCHEDULED_JOB, status: "searching" });
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "x", lat: 1, lng: 2 }),
      params(),
    );
    expect(res.status).toBe(409);
  });

  it("rejects an invalid body (400)", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getJobMock.mockResolvedValueOnce(SCHEDULED_JOB);
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "only" }),
      params(),
    );
    expect(res.status).toBe(400);
  });

  it("fails closed when supabase admin is not configured (503)", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    isSupabaseAdminConfiguredMock.mockReturnValue(false);
    getJobMock.mockResolvedValueOnce(SCHEDULED_JOB);
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "x", lat: 1, lng: 2 }),
      params(),
    );
    expect(res.status).toBe(503);
  });

  it("returns 404 when the job is missing", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getJobMock.mockResolvedValueOnce(null);
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "x", lat: 1, lng: 2 }),
      params(),
    );
    expect(res.status).toBe(404);
  });

  it("returns 500 when the CAS update errors", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getJobMock.mockResolvedValueOnce(SCHEDULED_JOB);
    dispatchScheduledSecondProMock.mockResolvedValue({
      ok: false,
      conflict: false,
      message: "update failed",
    });
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "x", lat: 1, lng: 2 }),
      params(),
    );
    expect(res.status).toBe(500);
  });

  it("returns 409 when the scheduled job changes before the CAS update", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getJobMock.mockResolvedValueOnce(SCHEDULED_JOB);
    dispatchScheduledSecondProMock.mockResolvedValue({
      ok: false,
      conflict: true,
    });
    const res = await postDispatchScheduled(
      dispatchReq({ locationLabel: "x", lat: 1, lng: 2 }),
      params(),
    );
    expect(res.status).toBe(409);
    expect(advancePairingMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/jobs (create) meetProTrade handling", () => {
  const baseBody = {
    motoristId: "motorist-1",
    motoristName: "Ada",
    serviceType: "towing",
    problem: "Tyre burst on the highway",
    lat: 6.5244,
    lng: 3.3792,
  };

  it("passes a valid meetProTrade through to createJob", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    createJobMock.mockResolvedValue({ id: "j1", serviceType: "auto" } as never);

    const res = await postCreate(
      createReq({ ...baseBody, meetPro: true, meetProTrade: "mechanic" }),
    );
    expect(res.status).toBe(200);
    expect(createJobMock).toHaveBeenCalledTimes(1);
    const arg = createJobMock.mock.calls[0][0] as { meetProTrade: unknown };
    expect(arg.meetProTrade).toBe("mechanic");
  });

  it("coerces an invalid meetProTrade to null", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    createJobMock.mockResolvedValue({ id: "j1", serviceType: "auto" } as never);

    const res = await postCreate(
      createReq({ ...baseBody, meetPro: true, meetProTrade: "garbage-trade" }),
    );
    expect(res.status).toBe(200);
    const arg = createJobMock.mock.calls[0][0] as { meetProTrade: unknown };
    expect(arg.meetProTrade).toBeNull();
  });

  it("passes null when meetProTrade is absent", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    createJobMock.mockResolvedValue({ id: "j1", serviceType: "auto" } as never);

    const res = await postCreate(createReq(baseBody));
    expect(res.status).toBe(200);
    const arg = createJobMock.mock.calls[0][0] as { meetProTrade: unknown };
    expect(arg.meetProTrade).toBeNull();
  });

  it("rejects creating a job for another user (403)", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const res = await postCreate(
      createReq({ ...baseBody, motoristId: "other" }),
    );
    expect(res.status).toBe(403);
    expect(createJobMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid serviceType (400)", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const res = await postCreate(
      createReq({ ...baseBody, serviceType: "not-a-service" }),
    );
    expect(res.status).toBe(400);
    expect(createJobMock).not.toHaveBeenCalled();
  });

  it("rejects a missing/invalid body (400)", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const res = await postCreate(createReq({}));
    expect(res.status).toBe(400);
    expect(createJobMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/jobs/expire-stale scheduledDispatch sweep wiring", () => {
  it("returns the scheduledDispatch sweep result alongside the other sweeps", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    expireOverdueBookedJobsMockOk();
    vi.mocked(sweepPairing).mockResolvedValue({
      checked: 7,
      timedOut: 2,
      expired: 1,
    });
    vi.mocked(sweepScheduledDispatches).mockResolvedValue({
      checked: 4,
      cancelled: 1,
      notified: 1,
    });
    vi.mocked(processDuePayoutRetries).mockResolvedValue({
      checked: 0,
      succeeded: 0,
      stillPending: 0,
      failed: 0,
      ids: [],
    });

    const res = await getExpireStale(
      new Request("http://localhost/api/jobs/expire-stale"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.scheduledDispatch).toEqual({
      checked: 4,
      cancelled: 1,
      notified: 1,
    });
    expect(body.data.pairing).toEqual({ checked: 7, timedOut: 2, expired: 1 });
  });
});

function expireOverdueBookedJobsMockOk() {
  vi.mocked(expireOverdueBookedJobs).mockResolvedValue({
    checked: 0,
    cancelled: 0,
    released: 0,
    ids: [],
  });
  vi.mocked(expireUnacceptedJobs).mockResolvedValue({
    checked: 0,
    rerouted: 0,
    expired: 0,
  });
}
