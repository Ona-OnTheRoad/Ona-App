import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
  getSupabaseUrl: vi.fn(() => "http://localhost"),
  getSupabaseAnonKey: vi.fn(() => "anon"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { GET } from "@/app/api/pros/live/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req() {
  return new Request("http://localhost/api/pros/live", {
    headers: { authorization: "Bearer t" },
  });
}

function makeSb(result: {
  data: { is_online: boolean } | null;
  error?: { message: string } | null;
}) {
  const sb = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => result),
        })),
      })),
    })),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("GET /api/pros/live", () => {
  it("returns the caller's own online status, derived from the session", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    const sb = makeSb({ data: { is_online: true } });

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ online: true });
    expect(sb.from).toHaveBeenCalledWith("repair_pro_profiles");
  });

  it("returns null when the caller has no pro profile", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    makeSb({ data: null });

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ online: null });
  });

  it("returns 401 when the caller is not authenticated", async () => {
    requireUserMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false }), { status: 401 }),
    });

    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("returns 503 when Supabase admin isn't configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await GET(req());
    expect(res.status).toBe(503);
    expect(requireUserMock).not.toHaveBeenCalled();
  });

  it("returns 500 on a database error", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    makeSb({ data: null, error: { message: "db down" } });

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.message).toBe("db down");
  });
});
