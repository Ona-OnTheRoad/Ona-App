import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { GET } from "@/app/api/requests/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(qs: string) {
  return new Request(`http://localhost/api/requests?${qs}`, {
    headers: { authorization: "Bearer t" },
  });
}

type ReqRow = {
  id: string;
  job_version?: number;
  motorist_id: string;
  repair_pro_id: string | null;
  service_type: string;
  status: string;
  description: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_address: string | null;
  radius_km: number | null;
  created_at: string;
  updated_at: string;
};

function makeSb(opts: {
  rows?: { data: ReqRow[] | null; error?: { message: string } | null };
  profiles?: { data: { id: string; full_name: string }[] | null };
}) {
  const rows = opts.rows ?? { data: [], error: null };
  const profiles = opts.profiles ?? { data: [] };
  const sb = {
    from: vi.fn((table: string) => {
      if (table === "service_requests") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(async () => rows),
              })),
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async () => profiles),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("GET /api/requests", () => {
  it("returns mapped requests for the caller's own motorist jobs", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({
      rows: {
        data: [
          {
            id: "req-1",
            job_version: 12,
            motorist_id: "motorist-1",
            repair_pro_id: "pro-1",
            service_type: "mechanic",
            status: "accepted",
            description: "Flat tire",
            pickup_lat: 6.5,
            pickup_lng: 3.3,
            pickup_address: "Somewhere",
            radius_km: 5,
            created_at: "2026-10-10T00:00:00.000Z",
            updated_at: "2026-10-10T00:00:00.000Z",
          },
        ],
        error: null,
      },
      profiles: { data: [{ id: "pro-1", full_name: "Jane Pro" }] },
    });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.requests).toHaveLength(1);
    expect(json.data.requests[0]).toMatchObject({
      id: "req-1",
      jobVersion: 12,
      technicianId: "pro-1",
      technicianName: "Jane Pro",
      motoristId: "motorist-1",
    });
  });

  it("returns 403 when userId doesn't match the session", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));
    makeSb({});

    const res = await GET(req("userId=motorist-1&role=motorist"));
    expect(res.status).toBe(403);
  });

  it("returns 400 when role is missing or invalid", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({});

    const res = await GET(req("userId=motorist-1&role=bogus"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when the caller is not authenticated", async () => {
    requireUserMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false }), { status: 401 }),
    });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    expect(res.status).toBe(401);
  });

  it("returns 500 on a database error", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({ rows: { data: null, error: { message: "db down" } } });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.message).toBe("db down");
  });
});
