import { scriptedDb, sharedProfile, motorist, pro } from "@/lib/server/identity/__tests__/scripted-db";
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
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase admin isn't configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await GET(req());
    expect(res.status).toBe(503);
    expect(requireUserMock).not.toHaveBeenCalled();
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });

  it("scopes every read to the session even when another userId is supplied", async () => {
    requireUserMock.mockResolvedValue(authOk("session-user"));
    const sb = scriptedDb({ profiles: [{ data: sharedProfile }], motorist_profiles: [{ data: motorist }], repair_pro_profiles: [{ data: pro }], repair_pro_guarantors: [{ data: null }] });
    createServiceSupabaseMock.mockReturnValue(sb as never);
    expect((await GET(new Request("http://localhost/api/profile?userId=other-user"))).status).toBe(200);
    expect(sb.calls.map(c => c.table)).toEqual(["profiles", "motorist_profiles", "repair_pro_profiles", "repair_pro_guarantors"]);
    expect(sb.calls.every(c => c.steps[0].args[0] === "*")).toBe(true);
    expect(sb.calls.map(c => c.steps[1].args)).toEqual([["id", "session-user"], ["user_id", "session-user"], ["user_id", "session-user"], ["user_id", "session-user"]]);
  });

  it("prefers stored primary role over side-profile creation dates and preserves switch metadata", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({ profile: { data: { ...sharedProfile, primary_role: "repair_pro", role_switch_count: 4, last_role_switch_at: "2026-10-10" } }, mot: { data: motorist }, pro: { data: pro } });
    const body = await (await GET(req())).json();
    expect(body.data.profile).toMatchObject({ primaryAccountType: "professional", dualRole: true, roleSwitchCount: 4, lastRoleSwitchAt: "2026-10-10" });
  });

  it("falls back to creation dates and pro bank when customer bank is missing", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({ profile: { data: sharedProfile }, mot: { data: { ...motorist, created_at: "2026-03-01", bank_name: null, bank_account_number: null, bank_code: null } }, pro: { data: pro } });
    const body = await (await GET(req())).json();
    expect(body.data.profile).toMatchObject({ primaryAccountType: "professional", bankName: "Pro Bank", bankAccountNumber: "9999999999", bankCode: "002" });
  });

  it.each([
    [{}, "none", false],
    [{ nin_last4: "1234" }, "submitted", false],
    [{ identity_verified_at: "2026-01-02" }, "approved", true],
    [{ identity_review_status: "rejected", identity_verified_at: "2026-01-02" }, "rejected", true],
  ])("preserves customer identity status fallback for %j", async (fields, status, verified) => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({ profile: { data: sharedProfile }, mot: { data: fields } });
    const body = await (await GET(req())).json();
    expect(body.data.profile).toMatchObject({ identityReviewStatus: status, govIdVerified: verified });
  });

  it("maps professional pricing/focus and customer bank fallback without syncing", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({ profile: { data: { ...sharedProfile, role: "repair_pro", phone_verified: true } }, mot: { data: motorist }, pro: { data: { ...pro, bank_name: null, docs_status: null, labour_prices: { mechanic: 1234 }, vehicle_focus: { servedBrand: "Toyota" }, jobs_completed: 6, rating_avg: "4.5" } }, guarantor: { data: { full_name: "Grace", phone: "123", relationship: "Sister", linked_user_id: "guarantor-1" } } });
    const body = await (await GET(req())).json();
    expect(body.data.profile).toMatchObject({ bankName: "Customer Bank", phoneVerified: true, docsStatus: "approved", servicePrices: { mechanic: 1234 }, servedBrand: "Toyota", jobsCompleted: 6, averageRating: 4.5, guarantor: { fullName: "Grace", linkedUserId: "guarantor-1" } });
  });

  it("keeps a failed shared read without data as 200/null and stops there", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    const sb = scriptedDb({ profiles: [{ data: null, error: { message: "unavailable" } }] });
    createServiceSupabaseMock.mockReturnValue(sb as never);
    const response = await GET(req());
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ profile: null });
    expect(sb.calls).toHaveLength(1);
  });

  it("treats returned side-read errors as empty fields, while using any returned data", async () => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    makeSb({ profile: { data: { ...sharedProfile, role: "repair_pro" }, error: { message: "partial" } }, mot: { data: motorist, error: { message: "partial" } }, pro: { data: null, error: { message: "failed" } }, guarantor: { data: null, error: { message: "failed" } } });
    const response = await GET(req());
    expect(response.status).toBe(200);
    expect((await response.json()).data.profile).toMatchObject({ accountType: "professional", bankName: "Customer Bank", services: [], docsStatus: "approved", dualRole: false });
  });

  it.each([[new Error("read failed"), "read failed"], ["non-error failure", "Could not load profile"]])("keeps thrown read errors mapped to 500", async (failure, message) => {
    requireUserMock.mockResolvedValue(authOk("user-1"));
    createServiceSupabaseMock.mockImplementationOnce(() => { throw failure; });
    const response = await GET(req());
    expect(response.status).toBe(500);
    expect((await response.json()).error).toEqual({ code: "error", message });
  });
});
