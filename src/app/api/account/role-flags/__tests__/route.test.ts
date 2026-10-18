import { scriptedDb } from "@/lib/server/identity/__tests__/scripted-db";
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
import { GET } from "@/app/api/account/role-flags/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req() {
  return new Request("http://localhost/api/account/role-flags", {
    headers: { authorization: "Bearer t" },
  });
}

function makeSb(opts: {
  mot?: { data: { created_at?: string } | null };
  pro?: { data: { created_at?: string } | null };
}) {
  const mot = opts.mot ?? { data: null };
  const pro = opts.pro ?? { data: null };
  const sb = {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () =>
            table === "motorist_profiles" ? mot : pro,
          ),
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

describe("GET /api/account/role-flags", () => {
  it("returns dual-role flags for the session user, motorist earlier than pro", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({
      mot: { data: { created_at: "2026-01-01T00:00:00.000Z" } },
      pro: { data: { created_at: "2026-02-01T00:00:00.000Z" } },
    });

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({
      hasMotorist: true,
      hasPro: true,
      primaryAccountType: "motorist",
    });
  });

  it("returns single-role flags when only one side table exists", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({ pro: { data: { created_at: "2026-02-01T00:00:00.000Z" } } });

    const res = await GET(req());
    const json = await res.json();

    expect(json.data).toEqual({
      hasMotorist: false,
      hasPro: true,
      primaryAccountType: "professional",
    });
  });

  it("returns 401 when the caller is not authenticated", async () => {
    requireUserMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false }), { status: 401 }),
    });

    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase admin isn't configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await GET(req());
    expect(res.status).toBe(503);
    expect(requireUserMock).not.toHaveBeenCalled();
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });

  it("uses only session id and keeps slim projections when userId is supplied", async () => {
    requireUserMock.mockResolvedValue(authOk("session-user"));
    const sb = scriptedDb({ motorist_profiles: [{ data: { created_at: "2026-03-01" } }], repair_pro_profiles: [{ data: { created_at: "2026-01-01" } }] });
    createServiceSupabaseMock.mockReturnValue(sb as never);
    const response = await GET(new Request("http://localhost/api/account/role-flags?userId=other-user"));
    expect((await response.json()).data).toEqual({ hasMotorist: true, hasPro: true, primaryAccountType: "professional" });
    expect(sb.calls.map(c => c.steps)).toEqual(Array.from({ length: 2 }, () => [{ method: "select", args: ["user_id, created_at"] }, { method: "eq", args: ["user_id", "session-user"] }, { method: "maybeSingle", args: [] }]));
  });

  it("preserves absent-side returned errors as false flags", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    const sb = scriptedDb({ motorist_profiles: [{ data: null, error: { message: "unavailable" } }], repair_pro_profiles: [{ data: null, error: { message: "unavailable" } }] });
    createServiceSupabaseMock.mockReturnValue(sb as never);
    const response = await GET(req());
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ hasMotorist: false, hasPro: false, primaryAccountType: "motorist" });
  });

  it("uses returned role data despite a returned error", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    const sb = scriptedDb({ motorist_profiles: [{ data: { created_at: "2026-01-01" }, error: { message: "partial" } }], repair_pro_profiles: [{ data: null }] });
    createServiceSupabaseMock.mockReturnValue(sb as never);
    expect((await (await GET(req())).json()).data).toEqual({ hasMotorist: true, hasPro: false, primaryAccountType: "motorist" });
  });

  it.each([[new Error("read failed"), "read failed"], ["non-error failure", "Could not load role flags"]])("maps thrown read errors to 500", async (failure, message) => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    createServiceSupabaseMock.mockImplementationOnce(() => { throw failure; });
    const response = await GET(req());
    expect(response.status).toBe(500);
    expect((await response.json()).error).toEqual({ code: "error", message });
  });
});
