import { beforeEach, describe, expect, it, vi } from "vitest";
import { scriptedDb, sharedProfile, motorist, pro, type QueryReply } from "@/lib/server/identity/__tests__/scripted-db";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), service: vi.fn(), configured: vi.fn(),
  ensureRole: vi.fn(), syncBank: vi.fn(), listRoles: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: mocks.service }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: mocks.configured, getSupabaseUrl: () => "https://example.test", getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/identity/identity-sync", () => ({
  ensureUserRole: mocks.ensureRole, syncPayoutAcrossRoles: mocks.syncBank, listUserRoles: mocks.listRoles,
}));
import { POST } from "@/app/api/auth/switch-role/route";

function request(target = "professional") {
  return new Request("https://ona.test/api/auth/switch-role", { method: "POST", body: JSON.stringify({ access_token: "valid-access-token", target }) });
}
function db(opts: {
  target?: string; existing?: Record<string, unknown>; updated?: Record<string, unknown>;
  updateReplies?: QueryReply[]; mot?: unknown; professional?: unknown;
} = {}) {
  const target = opts.target ?? "professional";
  const role = target === "professional" ? "repair_pro" : "motorist";
  const existing: Record<string, unknown> = opts.existing ?? sharedProfile;
  const mot = opts.mot === undefined ? motorist : opts.mot;
  const professional = opts.professional === undefined ? pro : opts.professional;
  const sb = scriptedDb({
    profiles: [{ data: existing }, ...(opts.updateReplies ?? [{ data: opts.updated ?? { ...existing, role, primary_role: existing.primary_role || existing.role, role_switch_count: existing.role === role ? 0 : 1 } }])],
    motorist_profiles: [...(role === "motorist" ? [{ data: mot }] : []), { data: mot }, { data: mot }],
    repair_pro_profiles: [...(role === "repair_pro" ? [{ data: professional }] : []), { data: null }, { data: professional }, { data: professional }],
  });
  mocks.service.mockReturnValue(sb);
  return sb;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mocks.ensureRole.mockResolvedValue({ ok: true }); mocks.syncBank.mockResolvedValue({ ok: true });
  mocks.listRoles.mockResolvedValue(["motorist", "repair_pro"]);
});

describe("POST /api/auth/switch-role characterization", () => {
  it("switches to pro, preserves customer T2, filters services, and keeps the pro Away before bank sync", async () => {
    const sb = db();
    mocks.syncBank.mockImplementation(async () => {
      expect(sb.calls.map(c => c.table)).toEqual(["profiles", "repair_pro_profiles", "profiles", "repair_pro_profiles"]);
      expect(sb.calls[3].steps).toEqual([{ method: "update", args: [{ is_online: false }] }, { method: "eq", args: ["user_id", "user-1"] }]);
      return { ok: true };
    });
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ userId: "user-1", accountType: "professional", role: "repair_pro", hasMotorist: true, hasPro: true,
      dualRole: true, primaryAccountType: "motorist", roleSwitchCount: 1, roles: ["motorist", "repair_pro"],
      userProfile: { services: ["mechanic", "solar"], phoneVerified: true, ninVerified: true, bvnVerified: true, identityReviewStatus: "approved", govIdVerified: true, govIdKind: "passport", bankName: "Pro Bank" },
      profile: { id: "user-1", role: "repair_pro", full_name: "Ada User" },
    });
    expect(sb.calls[2].steps[0]).toEqual({ method: "update", args: [{ role: "repair_pro", primary_role: "motorist", role_switch_count: 1, last_role_switch_at: expect.any(String) }] });
    expect(mocks.ensureRole).toHaveBeenCalledWith(sb, "user-1", "repair_pro", { userId: "user-1", source: "switch_role" });
    expect(sb.calls.slice(4).map(c => c.table)).toEqual(["repair_pro_profiles", "motorist_profiles", "motorist_profiles", "repair_pro_profiles"]);
    expect(sb.calls[6].steps[0].args).toEqual(["user_id, created_at"]);
  });

  it("switches to customer with customer-first bank and keeps the pro Away", async () => {
    const sb = db({ target: "motorist", existing: { ...sharedProfile, role: "repair_pro", primary_role: "repair_pro", role_switch_count: 4 }, updated: { ...sharedProfile, primary_role: "repair_pro", role_switch_count: 5, last_role_switch_at: "2026-10-10" } });
    const body = await (await POST(request("motorist"))).json();
    expect(body.data).toMatchObject({ accountType: "motorist", primaryAccountType: "professional", roleSwitchCount: 5, lastRoleSwitchAt: "2026-10-10", userProfile: { vehicleMake: "Toyota", bankName: "Customer Bank" } });
    expect(sb.calls[2].steps[0].args[0]).not.toHaveProperty("primary_role");
    expect(sb.calls[3].steps[0].args).toEqual([{ is_online: false }]);
  });

  it("does not bump switch count or timestamp when requesting the current role", async () => {
    const sb = db({ existing: { ...sharedProfile, role: "repair_pro", primary_role: "motorist", role_switch_count: 7 }, updated: { ...sharedProfile, role: "repair_pro", primary_role: "motorist", role_switch_count: 7 } });
    const body = await (await POST(request())).json();
    expect(sb.calls[2].steps[0].args).toEqual([{ role: "repair_pro" }]);
    expect(body.data).toMatchObject({ roleSwitchCount: 7, lastRoleSwitchAt: null });
  });

  it("locks a prior admin's primary role to the requested customer/pro role", async () => {
    const sb = db({ existing: { ...sharedProfile, role: "admin" } });
    expect((await POST(request())).status).toBe(200);
    expect(sb.calls[2].steps[0].args[0]).toMatchObject({ primary_role: "repair_pro" });
  });

  it.each(["motorist", "professional"])("requires a real %s side-profile and does not invent one", async target => {
    const sb = db({ target, mot: target === "motorist" ? null : motorist, professional: target === "professional" ? null : pro });
    const response = await POST(request(target));
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("needs_signup");
    expect(sb.calls).toHaveLength(2);
    expect(mocks.syncBank).not.toHaveBeenCalled();
  });

  it("retries failed profile update with role-only payload", async () => {
    const sb = db({ updateReplies: [{ data: null, error: { message: "missing columns" } }, { data: { ...sharedProfile, role: "repair_pro" } }] });
    const body = await (await POST(request())).json();
    expect(body.ok).toBe(true);
    expect(sb.calls[3].steps[0].args).toEqual([{ role: "repair_pro" }]);
    expect(body.data).toMatchObject({ primaryAccountType: "motorist", roleSwitchCount: 0 });
  });

  it("preserves first update error when both writes fail, before Away or sync", async () => {
    const sb = db({ updateReplies: [{ data: null, error: { message: "first failure" } }, { data: null, error: { message: "fallback failure" } }] });
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).toBe("first failure");
    expect(sb.calls).toHaveLength(4);
    expect(mocks.ensureRole).not.toHaveBeenCalled();
  });

  it("falls back when first write returns no row and uses the fallback error", async () => {
    db({ updateReplies: [{ data: null }, { data: null, error: { message: "fallback failure" } }] });
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).toBe("fallback failure");
  });

  it.each([false, null, undefined])("blocks inactive/falsey active flag %s", async active => {
    const sb = db({ existing: { ...sharedProfile, is_active: active } });
    expect((await POST(request())).status).toBe(403);
    expect(sb.calls).toHaveLength(1);
  });

  it.each([{ data: null }, { data: sharedProfile, error: { message: "read error" } }])("returns 404 on missing/errored shared profile", async reply => {
    const sb = scriptedDb({ profiles: [reply] }); mocks.service.mockReturnValue(sb);
    expect((await POST(request())).status).toBe(404);
    expect(sb.calls).toHaveLength(1);
  });

  it("keeps response successful when sync returns failure results", async () => {
    db(); mocks.ensureRole.mockResolvedValue({ ok: false }); mocks.syncBank.mockResolvedValue({ ok: false });
    expect((await POST(request())).status).toBe(200);
  });

  it("preserves rejection propagation when sync throws", async () => {
    db(); mocks.syncBank.mockRejectedValue(new Error("sync failed"));
    await expect(POST(request())).rejects.toThrow("sync failed");
    expect(mocks.listRoles).not.toHaveBeenCalled();
  });

  it("returns 401 on rejected token before service-role access", async () => {
    mocks.getUser.mockResolvedValue({ data: {}, error: { message: "bad token" } });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("session_expired");
    expect(mocks.service).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, invalid target and unconfigured server before auth", async () => {
    expect((await POST(new Request("https://ona.test", { method: "POST", body: "{" }))).status).toBe(400);
    expect((await POST(request("admin"))).status).toBe(400);
    mocks.configured.mockReturnValue(false);
    expect((await POST(request())).status).toBe(503);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
