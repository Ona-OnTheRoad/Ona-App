import { beforeEach, describe, expect, it, vi } from "vitest";
import { scriptedDb, sharedProfile, motorist, pro, type QueryReply } from "@/lib/server/identity/__tests__/scripted-db";
vi.mock("@/lib/server/admin-auth", () => ({
  requireAdmin: vi.fn(), logAdminAction: vi.fn(),
  AdminAuthError: class extends Error {
    constructor(message: string, public status = 401) { super(message); }
  },
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/server/identity/identity-sync", () => ({ identityStatus: vi.fn() }));
import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { identityStatus } from "@/lib/server/identity/identity-sync";
import { GET } from "@/app/api/admin/users/[id]/route";

const status = { roles: ["motorist", "repair_pro"], hasMotorist: true, hasPro: true, payoutMethod: null, syncStatus: "needs_sync", missingFields: ["payout_method"], completedFields: [], syncLog: [{ action: "identity_sync" }], pendingMerges: [] };
function request() { return new Request("https://ona.test/api/admin/users/user-1?userId=other"); }
function context(id = "user-1") { return { params: Promise.resolve({ id }) }; }
function db(overrides: Record<string, QueryReply[]> = {}) {
  const sb = scriptedDb({ profiles: [{ data: sharedProfile }], motorist_profiles: [{ data: motorist }], repair_pro_profiles: [{ data: pro }], service_requests: [{ data: [{ id: "job-1" }] }], bookings: [{ data: [{ id: "booking-1" }] }], payments: [{ data: [{ id: "payment-1" }] }], reviews: [{ data: [{ id: "review-1" }] }], ...overrides });
  vi.mocked(createServiceSupabase).mockReturnValue(sb as never);
  return sb;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isSupabaseAdminConfigured).mockReturnValue(true);
  vi.mocked(requireAdmin).mockResolvedValue({ session: { userId: "admin-1" } } as never);
  vi.mocked(identityStatus).mockResolvedValue(status as never);
});

describe("GET /api/admin/users/[id] characterization", () => {
  it.each(["motorist", "repair_pro"])("preserves full raw %s identity, status and all history arrays", async role => {
    const sb = db({ profiles: [{ data: { ...sharedProfile, role } }] });
    const response = await GET(request(), context());
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ user: { ...sharedProfile, role, motorist_profiles: motorist, repair_pro_profiles: pro }, identity: status, jobs: [{ id: "job-1" }], bookings: [{ id: "booking-1" }], payments: [{ id: "payment-1" }], reviews: [{ id: "review-1" }] });
    expect(identityStatus).toHaveBeenCalledWith(sb, "user-1");
    expect(sb.calls[0].steps).toEqual([{ method: "select", args: ["id, role, full_name, phone, email, city, area, is_active, avatar_url, created_at, updated_at"] }, { method: "eq", args: ["id", "user-1"] }, { method: "maybeSingle", args: [] }]);
    expect(sb.calls.slice(1, 3).map(c => c.steps)).toEqual(Array.from({ length: 2 }, () => [{ method: "select", args: ["*"] }, { method: "eq", args: ["user_id", "user-1"] }, { method: "maybeSingle", args: [] }]));
    expect(sb.calls.slice(3).map(c => c.table)).toEqual(["service_requests", "bookings", "payments", "reviews"]);
    expect(sb.calls.slice(3).map(c => c.steps.slice(1))).toEqual([50, 30, 30, 20].map(limit => [{ method: "or", args: ["motorist_id.eq.user-1,repair_pro_id.eq.user-1"] }, { method: "order", args: ["created_at", { ascending: false }] }, { method: "limit", args: [limit] }]));
    expect(sb.calls[3].steps[0].args).toEqual(["id, service_type, status, description, pickup_address, created_at, completed_at, motorist_id, repair_pro_id"]);
    expect(sb.calls[5].steps[0].args).toEqual(["id, amount_kobo, status, currency, provider, created_at, paid_at, motorist_id, repair_pro_id"]);
  });

  it("keeps identity and history clients inside their respective boundaries", async () => {
    const identityDb = scriptedDb({ profiles: [{ data: sharedProfile }], motorist_profiles: [{ data: motorist }], repair_pro_profiles: [{ data: pro }] });
    const historyDb = scriptedDb({ service_requests: [{ data: [] }], bookings: [{ data: [] }], payments: [{ data: [] }], reviews: [{ data: [] }] });
    vi.mocked(createServiceSupabase).mockReturnValueOnce(identityDb as never).mockReturnValueOnce(historyDb as never);
    const response = await GET(request(), context());
    expect(response.status).toBe(200);
    expect(identityDb.calls.map(c => c.table)).toEqual(["profiles", "motorist_profiles", "repair_pro_profiles"]);
    expect(historyDb.calls.map(c => c.table)).toEqual(["service_requests", "bookings", "payments", "reviews"]);
    expect(identityStatus).toHaveBeenCalledWith(identityDb, "user-1");
    expect(createServiceSupabase).toHaveBeenCalledTimes(2);
  });

  it("preserves shared error precedence even when data is returned", async () => {
    const sb = db({ profiles: [{ data: sharedProfile, error: { message: "shared read failed" } }] });
    const response = await GET(request(), context());
    expect(response.status).toBe(500);
    expect((await response.json()).error).toEqual({ code: "error", message: "shared read failed" });
    expect(sb.calls).toHaveLength(1);
    expect(identityStatus).not.toHaveBeenCalled();
  });

  it("returns 404 before any secondary/history/status reads when shared profile is absent", async () => {
    const sb = db({ profiles: [{ data: null }] });
    const response = await GET(request(), context());
    expect(response.status).toBe(404);
    expect((await response.json()).error.message).toBe("User not found");
    expect(sb.calls).toHaveLength(1);
    expect(identityStatus).not.toHaveBeenCalled();
  });

  it("keeps null side profiles and empty histories when secondary reads return errors", async () => {
    const failed = [{ data: null, error: { message: "secondary read failed" } }];
    db(Object.fromEntries(["motorist_profiles", "repair_pro_profiles", "service_requests", "bookings", "payments", "reviews"].map(table => [table, [...failed]])));
    const response = await GET(request(), context());
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ user: { ...sharedProfile, motorist_profiles: null, repair_pro_profiles: null }, identity: status, jobs: [], bookings: [], payments: [], reviews: [] });
  });

  it("keeps secondary returned data despite errors", async () => {
    db({ motorist_profiles: [{ data: motorist, error: { message: "partial" } }], payments: [{ data: [{ id: "paid" }], error: { message: "partial" } }] });
    const body = await (await GET(request(), context())).json();
    expect(body.data.user.motorist_profiles).toEqual(motorist);
    expect(body.data.payments).toEqual([{ id: "paid" }]);
  });

  it.each(["profiles", "motorist_profiles", "service_requests", "bookings", "payments", "reviews"])("keeps thrown %s read errors generic", async table => {
    db({ [table]: [new Error("private query detail")] });
    const response = await GET(request(), context());
    expect(response.status).toBe(500);
    expect((await response.json()).error).toEqual({ code: "error", message: "Failed to load user" });
  });

  it.each([
    ["service_requests", "jobs"], ["bookings", "bookings"],
    ["payments", "payments"], ["reviews", "reviews"],
  ])("preserves returned-error defaults and partial data for %s", async (table, field) => {
    db({ [table]: [{ data: null, error: { message: "history unavailable" } }] });
    const empty = await GET(request(), context());
    expect(empty.status).toBe(200);
    expect((await empty.json()).data[field]).toEqual([]);

    db({ [table]: [{ data: [{ id: "partial-row" }], error: { message: "partial history" } }] });
    const partial = await GET(request(), context());
    expect(partial.status).toBe(200);
    expect((await partial.json()).data[field]).toEqual([{ id: "partial-row" }]);
  });

  it.each([
    { data: null },
    { data: sharedProfile, error: { message: "shared read failed" } },
  ])("does not create the history client when the shared-profile guard stops loading", async reply => {
    db({ profiles: [reply] });
    await GET(request(), context());
    expect(createServiceSupabase).toHaveBeenCalledTimes(1);
  });

  it("keeps identity-status failure generic", async () => {
    db(); vi.mocked(identityStatus).mockRejectedValue(new Error("private status detail"));
    const response = await GET(request(), context());
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).toBe("Failed to load user");
  });

  it("starts the secondary reads before identity status resolves", async () => {
    const sb = db();
    let release!: (value: Awaited<ReturnType<typeof identityStatus>>) => void;
    vi.mocked(identityStatus).mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const pending = GET(request(), context());
    await vi.waitFor(() => expect(identityStatus).toHaveBeenCalled());
    await vi.waitFor(() => expect(sb.calls).toHaveLength(7));
    release(status as never);
    expect((await pending).status).toBe(200);
  });

  it.each([401, 403])("keeps admin rejection %s before persistence", async code => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthError("Denied", code));
    const response = await GET(request(), context());
    expect(response.status).toBe(code);
    expect((await response.json()).error).toEqual({ code: "auth", message: "Denied" });
    expect(createServiceSupabase).not.toHaveBeenCalled();
    expect(identityStatus).not.toHaveBeenCalled();
  });

  it("guards configuration before authorization", async () => {
    vi.mocked(isSupabaseAdminConfigured).mockReturnValue(false);
    const response = await GET(request(), context());
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("supabase_not_configured");
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(createServiceSupabase).not.toHaveBeenCalled();
  });
});
