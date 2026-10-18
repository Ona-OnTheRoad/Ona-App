import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  armSurfacePairingDeadline,
  dispatchScheduledSecondPro,
} from "@/lib/server/jobs/job-store/dispatch";
import type { JobRecord } from "@/lib/jobs/types";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function makeSb(result: { data: { id: string } | null; error?: { message: string } | null }) {
  const query = {
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    select: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  };
  const sb = { from: vi.fn(() => ({ update: vi.fn(() => query) })) };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("armSurfacePairingDeadline", () => {
  const baseJob = {
    id: "job-1",
    jobVersion: 3,
    pairingStage: "waiting_for_pro",
    pairingDeadline: null,
  } as unknown as JobRecord;

  it("arms the deadline once when the stage is actionable and unarmed", async () => {
    const sb = makeSb({ data: { id: "job-1" } });

    const result = await armSurfacePairingDeadline(baseJob);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.armed).toBe(true);
      expect(result.pairingDeadline).not.toBeNull();
    }
    expect(sb.from).toHaveBeenCalledWith("service_requests");
  });

  it("does not re-arm when a deadline is already set", async () => {
    const sb = makeSb({ data: { id: "job-1" } });
    const job = { ...baseJob, pairingDeadline: "2026-10-10T00:00:00.000Z" };

    const result = await armSurfacePairingDeadline(job);

    expect(result).toEqual({
      ok: true,
      armed: false,
      pairingDeadline: "2026-10-10T00:00:00.000Z",
    });
    expect(sb.from).not.toHaveBeenCalled();
  });

  it("is a no-op when the stage isn't an actionable pairing stage", async () => {
    const sb = makeSb({ data: { id: "job-1" } });
    const job = { ...baseJob, pairingStage: "sequential_pairing" };

    const result = await armSurfacePairingDeadline(job);

    expect(result).toEqual({ ok: true, armed: false, pairingDeadline: null });
    expect(sb.from).not.toHaveBeenCalled();
  });

  it("returns a conflict when the row changed under the guard", async () => {
    makeSb({ data: null });

    const result = await armSurfacePairingDeadline(baseJob);

    expect(result).toEqual({ ok: false, conflict: true });
  });

  it("returns the db error message on a query failure", async () => {
    makeSb({ data: null, error: { message: "db down" } });

    const result = await armSurfacePairingDeadline(baseJob);

    expect(result).toEqual({ ok: false, conflict: false, message: "db down" });
  });
});

describe("dispatchScheduledSecondPro", () => {
  const job = {
    id: "tow-1",
    jobVersion: 1,
    pairingRadiusKm: 5,
    statusHistory: [{ status: "scheduled", at: "2026-08-17T00:00:00.000Z" }],
  } as unknown as JobRecord;

  it("stamps the address and moves the job to sequential_pairing", async () => {
    const sb = makeSb({ data: { id: "tow-1" } });

    const result = await dispatchScheduledSecondPro(job, {
      locationLabel: "Near the mall",
      lat: 6.5244,
      lng: 3.3792,
    });

    expect(result).toEqual({ ok: true });
    expect(sb.from).toHaveBeenCalledWith("service_requests");
  });

  it("returns a conflict when the flow_status/job_version guard misses", async () => {
    makeSb({ data: null });

    const result = await dispatchScheduledSecondPro(job, {
      locationLabel: "x",
      lat: 1,
      lng: 2,
    });

    expect(result).toEqual({ ok: false, conflict: true });
  });

  it("returns the db error message on a query failure", async () => {
    makeSb({ data: null, error: { message: "update failed" } });

    const result = await dispatchScheduledSecondPro(job, {
      locationLabel: "x",
      lat: 1,
      lng: 2,
    });

    expect(result).toEqual({
      ok: false,
      conflict: false,
      message: "update failed",
    });
  });
});
