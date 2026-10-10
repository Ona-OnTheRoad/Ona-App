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
import { GET } from "@/app/api/profile/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req() {
  return new Request("http://localhost/api/profile", {
    headers: { authorization: "Bearer t" },
  });
}

type Single<T> = { data: T | null; error?: { message: string } | null };

function makeSb(opts: {
  profile?: Single<Record<string, unknown>>;
  mot?: Single<Record<string, unknown>>;
  pro?: Single<Record<string, unknown>>;
  guarantor?: Single<Record<string, unknown>>;
}) {
  const profile = opts.profile ?? { data: null };
  const mot = opts.mot ?? { data: null };
  const pro = opts.pro ?? { data: null };
  const guarantor = opts.guarantor ?? { data: null };
  const sb = {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => {
            if (table === "profiles") return profile;
            if (table === "motorist_profiles") return mot;
            if (table === "repair_pro_profiles") return pro;
            if (table === "repair_pro_guarantors") return guarantor;
            throw new Error(`unexpected table ${table}`);
          }),
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

describe("GET /api/profile", () => {
  it("returns null when the caller has no profile row", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({});

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ profile: null });
  });

  it("builds a motorist profile, preferring customer-side bank details", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({
      profile: {
        data: {
          id: "user-1",
          role: "motorist",
          full_name: "Mo Torist",
          phone: "+2340000000",
          email: "mo@example.com",
          avatar_url: null,
          city: "Lagos",
          area: "Lekki",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
      mot: {
        data: {
          vehicle_make: "Toyota",
          bank_name: "GTB",
          bank_account_number: "0000000001",
          nin_last4: "1234",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
      pro: { data: { bank_name: "Zenith", bank_account_number: "9999999999" } },
    });

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.profile).toMatchObject({
      fullName: "Mo Torist",
      accountType: "motorist",
      vehicleMake: "Toyota",
      bankName: "GTB",
      bankAccountNumber: "0000000001",
      identityReviewStatus: "submitted",
    });
  });

  it("builds a professional profile, preferring pro-side bank details and including the guarantor", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    makeSb({
      profile: {
        data: {
          id: "pro-1",
          role: "repair_pro",
          full_name: "Jane Pro",
          phone: "+2340000001",
          email: "jane@example.com",
          avatar_url: null,
          city: "Lagos",
          area: "Lekki",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
      pro: {
        data: {
          primary_service: "mechanic",
          bank_name: "Zenith",
          bank_account_number: "9999999999",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
      mot: { data: { bank_name: "GTB", bank_account_number: "0000000001" } },
      guarantor: {
        data: {
          full_name: "Guarantor Name",
          phone: "+2340000002",
          relationship: "Brother",
        },
      },
    });

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.profile).toMatchObject({
      fullName: "Jane Pro",
      accountType: "professional",
      bankName: "Zenith",
      bankAccountNumber: "9999999999",
      guarantor: { fullName: "Guarantor Name", relationship: "Brother" },
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
