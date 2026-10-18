import { beforeEach, describe, expect, it, vi } from "vitest";
import { scriptedDb, sharedProfile, motorist, pro } from "@/lib/server/identity/__tests__/scripted-db";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(), service: vi.fn(), configured: vi.fn(), adminConfigured: vi.fn(),
  rateLimit: vi.fn(), ensureRole: vi.fn(), syncBank: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { signInWithPassword: mocks.signIn } }) }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: mocks.service }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: mocks.configured, isSupabaseAdminConfigured: mocks.adminConfigured,
  getSupabaseUrl: () => "https://example.test", getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: mocks.rateLimit, rateLimitUnavailableResponse: () => null,
}));
vi.mock("@/lib/server/identity/identity-sync", () => ({
  ensureUserRole: mocks.ensureRole, syncPayoutAcrossRoles: mocks.syncBank,
}));
import { POST } from "@/app/api/auth/login/route";

function request(body: unknown = { email: "ADA@example.com", password: "password" }) {
  return new Request("https://ona.test/api/auth/login", { method: "POST", body: JSON.stringify(body) });
}
function db(profile = sharedProfile, mot: unknown = motorist, professional: unknown = pro) {
  const sb = scriptedDb({
    profiles: [{ data: profile }, { data: profile }],
    motorist_profiles: [{ data: mot }, { data: mot }],
    repair_pro_profiles: [{ data: professional }, { data: professional }],
  });
  mocks.service.mockReturnValue(sb);
  return sb;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.adminConfigured.mockReturnValue(true);
  mocks.rateLimit.mockResolvedValue({ ok: true });
  mocks.ensureRole.mockResolvedValue({ ok: true });
  mocks.syncBank.mockResolvedValue({ ok: true });
  mocks.signIn.mockResolvedValue({ data: {
    user: { id: "user-1", user_metadata: {} },
    session: { access_token: "access", refresh_token: "refresh", expires_at: 123 },
  }, error: null });
});

describe("POST /api/auth/login characterization", () => {
  it("returns tokens and a motorist profile, with pro-first bank precedence, then reloads after sync", async () => {
    const sb = db();
    mocks.syncBank.mockImplementation(async () => {
      expect(sb.calls).toHaveLength(3);
      return { ok: true };
    });
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ userId: "user-1", hasMotorist: true, hasPro: true,
      access_token: "access", refresh_token: "refresh", expires_at: 123, primaryAccountType: "motorist",
      profile: { accountType: "motorist", vehicleMake: "Toyota", bankName: "Pro Bank", bankCode: "002" },
    });
    expect(mocks.signIn).toHaveBeenCalledWith({ email: "ada@example.com", password: "password" });
    expect(mocks.ensureRole.mock.calls.map(c => c[2])).toEqual(["motorist", "repair_pro"]);
    expect(sb.calls.map(c => c.table)).toEqual(["profiles", "motorist_profiles", "repair_pro_profiles", "profiles", "motorist_profiles", "repair_pro_profiles"]);
    expect(sb.calls.every(c => c.steps.some(s => s.method === "eq" && s.args[1] === "user-1"))).toBe(true);
    expect(sb.calls[1].steps[0].args).toEqual(["vehicle_make, vehicle_model, vehicle_year, plate_number, vehicle_photo, vehicle_common_issues, vehicles, nin_verified, bvn_verified, identity_verified_at, created_at, bank_name, bank_account_name, bank_account_number, bank_code"]);
  });

  it("maps professional fields and falls back to customer bank", async () => {
    db({ ...sharedProfile, role: "repair_pro" }, motorist, { ...pro, bank_name: null, bank_code: null, bank_account_number: null, rating_avg: "4.8", jobs_completed: 7, labour_prices: { mechanic: 2000 }, vehicle_focus: { servedBrand: "Toyota" } });
    const body = await (await POST(request())).json();
    expect(body.data.profile).toMatchObject({ accountType: "professional", businessName: "Ada Repairs", bankName: "Customer Bank", averageRating: 4.8, jobsCompleted: 7, servedBrand: "Toyota", servicePrices: { mechanic: 2000 } });
  });

  it("returns the reloaded bank after mirroring", async () => {
    const sb = scriptedDb({ profiles: [{ data: sharedProfile }, { data: sharedProfile }], motorist_profiles: [{ data: motorist }, { data: { ...motorist, bank_name: "Mirrored" } }], repair_pro_profiles: [{ data: null }, { data: null }] });
    mocks.service.mockReturnValue(sb);
    const body = await (await POST(request())).json();
    expect(body.data.profile.bankName).toBe("Mirrored");
  });

  it("repairs missing profile from metadata with the same upsert payload", async () => {
    const sb = scriptedDb({ profiles: [{ data: null, error: { message: "read error" } }, { data: { ...sharedProfile, role: "repair_pro" } }, { data: { ...sharedProfile, role: "repair_pro" } }], motorist_profiles: [{ data: null }, { data: null }], repair_pro_profiles: [{ data: pro }, { data: pro }] });
    mocks.service.mockReturnValue(sb);
    mocks.signIn.mockResolvedValue({ data: { user: { id: "user-1", user_metadata: { account_type: "professional", fullName: " Ada ", phone: " 123 " } }, session: { access_token: "access" } } });
    expect((await POST(request())).status).toBe(200);
    expect(sb.calls[1].steps[0]).toEqual({ method: "upsert", args: [{ id: "user-1", role: "repair_pro", full_name: "Ada", phone: "123", email: "ada@example.com", is_active: true, updated_at: expect.any(String) }, { onConflict: "id" }] });
  });

  it("returns 500 when missing profile repair fails", async () => {
    const sb = scriptedDb({ profiles: [{ data: null }, { data: null, error: { message: "repair failed" } }] });
    mocks.service.mockReturnValue(sb);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).toBe("Account exists but profile could not be loaded. Contact support.");
    expect(mocks.syncBank).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("blocks explicitly inactive profiles before role reads or sync", async () => {
    const sb = db({ ...sharedProfile, is_active: false });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("deactivated");
    expect(sb.calls).toHaveLength(1);
    expect(mocks.ensureRole).not.toHaveBeenCalled();
  });

  it("keeps active-role flags on absent side rows and ignores returned query errors", async () => {
    db(sharedProfile, null, null);
    const body = await (await POST(request())).json();
    expect(body.data).toMatchObject({ hasMotorist: true, hasPro: false });
    expect(mocks.ensureRole.mock.calls.map(c => c[2])).toEqual(["motorist"]);
  });

  it("keeps login successful when identity sync throws", async () => {
    const sb = db();
    mocks.syncBank.mockRejectedValue(new Error("sync unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(200);
    expect(sb.calls).toHaveLength(3);
    vi.restoreAllMocks();
  });

  it("keeps the original profile if the reload cannot repair it", async () => {
    const sb = scriptedDb({ profiles: [{ data: sharedProfile }, { data: null }, { data: null }], motorist_profiles: [{ data: motorist }], repair_pro_profiles: [{ data: pro }] });
    mocks.service.mockReturnValue(sb);
    const body = await (await POST(request())).json();
    expect(body.data.profile.fullName).toBe("Ada User");
  });

  it.each([[false, true], [true, false]])("handles configuration flags configured=%s admin=%s", async (configured, admin) => {
    mocks.configured.mockReturnValue(configured); mocks.adminConfigured.mockReturnValue(admin);
    expect((await POST(request())).status).toBe(configured ? 500 : 503);
    expect(mocks.service).not.toHaveBeenCalled();
  });

  it("rejects invalid input before password auth", async () => {
    expect((await POST(request({ email: "bad" }))).status).toBe(400);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("maps credential errors to the existing 401 message", async () => {
    mocks.signIn.mockResolvedValue({ data: {}, error: { message: "Invalid login credentials" } });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect((await response.json()).error.message).toBe("Email or password is incorrect.");
    expect(mocks.service).not.toHaveBeenCalled();
  });

  it("keeps rate-limit and unavailable-security failures before auth", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, retryAfterSec: 10 });
    expect((await POST(request())).status).toBe(429);
    mocks.rateLimit.mockRejectedValueOnce(new Error("unavailable"));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
});
