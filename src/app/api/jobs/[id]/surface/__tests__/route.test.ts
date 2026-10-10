import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/jobs/job-store", () => ({
  getJob: vi.fn(),
  armSurfacePairingDeadline: vi.fn(),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  armSurfacePairingDeadline,
  getJob,
} from "@/lib/server/jobs/job-store";
import { POST } from "@/app/api/jobs/[id]/surface/route";
import type { JobRecord } from "@/lib/jobs/types";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const getJobMock = vi.mocked(getJob);
const armSurfacePairingDeadlineMock = vi.mocked(armSurfacePairingDeadline);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req() {
  return new Request("http://localhost/api/jobs/job-1/surface", {
    method: "POST",
    headers: { authorization: "Bearer t" },
  });
}

function params(id = "job-1") {
  return { params: Promise.resolve({ id }) };
}

const JOB = {
  id: "job-1",
  repairProId: "pro-1",
  pairingStage: "waiting_for_pro",
} as unknown as JobRecord;

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("POST /api/jobs/[id]/surface", () => {
  it("arms the pairing deadline for the assigned pro", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    getJobMock.mockResolvedValue(JOB);
    armSurfacePairingDeadlineMock.mockResolvedValue({
      ok: true,
      armed: true,
      pairingDeadline: "2026-10-10T00:02:24.000Z",
    });

    const res = await POST(req(), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toMatchObject({
      armed: true,
      pairingDeadline: "2026-10-10T00:02:24.000Z",
      pairingStage: "waiting_for_pro",
    });
  });

  it("rejects a pro who isn't assigned to this request", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));
    getJobMock.mockResolvedValue(JOB);

    const res = await POST(req(), params());
    expect(res.status).toBe(403);
    expect(armSurfacePairingDeadlineMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the job doesn't exist", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    getJobMock.mockResolvedValue(null);

    const res = await POST(req(), params());
    expect(res.status).toBe(404);
  });

  it("returns 409 on a write conflict", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    getJobMock.mockResolvedValue(JOB);
    armSurfacePairingDeadlineMock.mockResolvedValue({ ok: false, conflict: true });

    const res = await POST(req(), params());
    expect(res.status).toBe(409);
  });

  it("returns 500 on a db error", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    getJobMock.mockResolvedValue(JOB);
    armSurfacePairingDeadlineMock.mockResolvedValue({
      ok: false,
      conflict: false,
      message: "db down",
    });

    const res = await POST(req(), params());
    expect(res.status).toBe(500);
  });

  it("returns 401 when the caller is not authenticated", async () => {
    requireUserMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false }), { status: 401 }),
    });

    const res = await POST(req(), params());
    expect(res.status).toBe(401);
  });

  it("returns 503 when Supabase admin isn't configured", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await POST(req(), params());
    expect(res.status).toBe(503);
  });
});
