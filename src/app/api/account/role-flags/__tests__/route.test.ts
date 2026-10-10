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
  });

  it("returns 503 when Supabase admin isn't configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await GET(req());
    expect(res.status).toBe(503);
    expect(requireUserMock).not.toHaveBeenCalled();
  });
});
