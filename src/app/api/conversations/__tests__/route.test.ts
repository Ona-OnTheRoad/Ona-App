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
import { GET } from "@/app/api/conversations/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(qs: string) {
  return new Request(`http://localhost/api/conversations?${qs}`, {
    headers: { authorization: "Bearer t" },
  });
}

function makeSb(opts: {
  convs?: {
    data:
      | {
          id: string;
          motorist_id: string;
          repair_pro_id: string;
          request_id: string | null;
        }[]
      | null;
    error?: { message: string } | null;
  };
  msgs?: { data: unknown[] | null };
  profiles?: { data: { id: string; full_name: string; avatar_url: string | null }[] | null };
  jobs?: { data: { id: string; service_type: string }[] | null };
}) {
  const convs = opts.convs ?? { data: [], error: null };
  const msgs = opts.msgs ?? { data: [] };
  const profiles = opts.profiles ?? { data: [] };
  const jobs = opts.jobs ?? { data: [] };
  const sb = {
    from: vi.fn((table: string) => {
      if (table === "conversations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(async () => convs),
              })),
            })),
          })),
        };
      }
      if (table === "messages") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(async () => msgs),
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
      if (table === "service_requests") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async () => jobs),
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

describe("GET /api/conversations", () => {
  it("returns mapped threads for the caller's own motorist conversations", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({
      convs: {
        data: [
          {
            id: "conv-1",
            motorist_id: "motorist-1",
            repair_pro_id: "pro-1",
            request_id: "req-1",
          },
        ],
        error: null,
      },
      profiles: {
        data: [
          { id: "motorist-1", full_name: "Mo Torist", avatar_url: null },
          { id: "pro-1", full_name: "Jane Pro", avatar_url: "pic.png" },
        ],
      },
      jobs: { data: [{ id: "req-1", service_type: "mechanic" }] },
    });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.threads).toHaveLength(1);
    expect(json.data.threads[0]).toMatchObject({
      id: "conv-1",
      technicianId: "pro-1",
      technicianName: "Jane Pro",
      motoristName: "Mo Torist",
      serviceType: "mechanic",
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
    makeSb({ convs: { data: null, error: { message: "db down" } } });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.message).toBe("db down");
  });
});
