import { beforeEach, describe, expect, it, vi } from "vitest";
import { scriptedDb, sharedProfile, motorist, pro, type QueryReply } from "@/lib/server/identity/__tests__/scripted-db";
vi.mock("@/lib/server/admin-auth", () => ({
  requireAdmin: vi.fn(),
  AdminAuthError: class extends Error {
    constructor(message: string, public status = 401) { super(message); }
  },
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { GET } from "@/app/api/admin/users/route";

function request(query = "") { return new Request(`https://ona.test/api/admin/users${query}`); }
function db(replies: Record<string, QueryReply[]>) {
  const sb = scriptedDb(replies);
  vi.mocked(createServiceSupabase).mockReturnValue(sb as never);
  return sb;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isSupabaseAdminConfigured).mockReturnValue(true);
  vi.mocked(requireAdmin).mockResolvedValue({ userId: "admin-1" } as never);
});

describe("GET /api/admin/users characterization", () => {
  it("lists general profiles in query order with slim side profiles", async () => {
    const sb = db({ profiles: [{ data: [sharedProfile, { ...sharedProfile, id: "other" }] }], motorist_profiles: [{ data: [motorist] }], repair_pro_profiles: [{ data: [{ ...pro, verified: false, is_online: true, status: "approved" }] }] });
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.users.map((u: { id: string }) => u.id)).toEqual(["user-1", "other"]);
    expect(body.data.users[0]).toMatchObject({ ...sharedProfile, motorist_profiles: { vehicle_make: "Toyota", nin_verified: true, identity_review_status: "approved" }, repair_pro_profiles: { primary_service: "mechanic", status: "approved", verified: false, is_online: true, business_name: "Ada Repairs" } });
    expect(body.data.users[1]).toMatchObject({ motorist_profiles: null, repair_pro_profiles: null });
    expect(body.data.users[0].repair_pro_profiles).not.toHaveProperty("bank_account_number");
    expect(sb.calls[0].steps).toEqual([{ method: "select", args: ["id, role, full_name, phone, email, city, area, is_active, created_at, updated_at"] }, { method: "order", args: ["created_at", { ascending: false }] }, { method: "limit", args: [300] }]);
    expect(sb.calls.slice(1).map(c => c.steps[1])).toEqual(Array.from({ length: 2 }, () => ({ method: "in", args: ["user_id", ["user-1", "other"]] })));
  });

  it.each(["admin", "motorist"])("preserves %s filter and trimmed SQL search", async role => {
    const sb = db({ profiles: [{ data: [] }] });
    expect((await GET(request(`?role=${role}&q=%20Ada%20`))).status).toBe(200);
    expect(sb.calls[0].steps.slice(-2)).toEqual([{ method: "eq", args: ["role", role] }, { method: "or", args: ["full_name.ilike.%Ada%,email.ilike.%Ada%,phone.ilike.%Ada%"] }]);
    expect(sb.calls).toHaveLength(1);
  });

  it("ignores an unknown role and blank search without adding filters", async () => {
    const sb = db({ profiles: [{ data: [] }] });
    const body = await (await GET(request("?role=unknown&q=%20%20"))).json();
    expect(body.data).toEqual({ users: [] });
    expect(sb.calls[0].steps.map(s => s.method)).toEqual(["select", "order", "limit"]);
  });

  it("keeps dual-role customers in the special pro listing and coerces pro flags", async () => {
    const sb = db({ repair_pro_profiles: [{ data: [{ ...pro, verified: 1, is_online: null, nin_verified: "yes", bvn_verified: 0, status: "approved" }] }], profiles: [{ data: [sharedProfile] }] });
    const response = await GET(request("?role=repair_pro"));
    expect((await response.json()).data.users).toEqual([{ ...sharedProfile, updated_at: pro.created_at, motorist_profiles: null, repair_pro_profiles: { status: "approved", primary_service: "mechanic", verified: true, is_online: false, nin_verified: true, bvn_verified: false } }]);
    expect(sb.calls[0].steps.slice(-2)).toEqual([{ method: "order", args: ["created_at", { ascending: false }] }, { method: "limit", args: [400] }]);
    expect(sb.calls[1].steps[1]).toEqual({ method: "in", args: ["id", ["user-1"]] });
  });

  it.each(["ADA", "example.com", "8000000000"])("uses case-insensitive JS search for pro rows: %s", async q => {
    const sb = db({ repair_pro_profiles: [{ data: [pro, { ...pro, user_id: "other", business_name: "Other" }] }], profiles: [{ data: [sharedProfile] }] });
    const body = await (await GET(request(`?role=repair_pro&q=%20${q}%20`))).json();
    expect(body.data.users.map((u: { id: string }) => u.id)).toEqual(["user-1"]);
    expect(sb.calls.every(c => !c.steps.some(s => s.method === "or"))).toBe(true);
  });

  it("uses pro defaults when a shared profile is absent or its read fails", async () => {
    db({ repair_pro_profiles: [{ data: [pro] }], profiles: [{ data: null, error: { message: "secondary failed" } }] });
    const body = await (await GET(request("?role=repair_pro"))).json();
    expect(body.data.users).toEqual([{ id: "user-1", role: "repair_pro", full_name: "Ada Repairs", phone: null, email: null, city: null, area: null, is_active: true, created_at: pro.created_at, updated_at: pro.created_at, motorist_profiles: null, repair_pro_profiles: { primary_service: "mechanic", verified: false, is_online: false, nin_verified: false, bvn_verified: false } }]);
  });

  it("keeps explicitly inactive pro profile and business-name fallback", async () => {
    db({ repair_pro_profiles: [{ data: [pro] }], profiles: [{ data: [{ ...sharedProfile, full_name: "", is_active: false, updated_at: "2026-10-10" }] }] });
    const body = await (await GET(request("?role=repair_pro"))).json();
    expect(body.data.users[0]).toMatchObject({ full_name: "Ada Repairs", is_active: false, updated_at: "2026-10-10" });
  });

  it("does not read shared profiles when the pro list is empty", async () => {
    const sb = db({ repair_pro_profiles: [{ data: null }] });
    expect((await (await GET(request("?role=repair_pro"))).json()).data).toEqual({ users: [] });
    expect(sb.calls).toHaveLength(1);
  });

  it("ignores secondary side-profile errors and still uses returned data", async () => {
    db({ profiles: [{ data: [sharedProfile] }], motorist_profiles: [{ data: null, error: { message: "secondary" } }], repair_pro_profiles: [{ data: [pro], error: { message: "partial" } }] });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect((await response.json()).data.users[0]).toMatchObject({ motorist_profiles: null, repair_pro_profiles: { business_name: "Ada Repairs" } });
  });

  it.each(["", "?role=repair_pro"])("returns initial query errors verbatim for %s", async query => {
    const sb = db({ [query ? "repair_pro_profiles" : "profiles"]: [{ data: [], error: { message: "query failed" } }] });
    const response = await GET(request(query));
    expect(response.status).toBe(500);
    expect((await response.json()).error).toEqual({ code: "error", message: "query failed" });
    expect(sb.calls).toHaveLength(1);
  });

  it.each(["", "?role=repair_pro"])("maps thrown secondary reads to generic failure for %s", async query => {
    db(query ? { repair_pro_profiles: [{ data: [pro] }], profiles: [new Error("private detail")] } : { profiles: [{ data: [sharedProfile] }], motorist_profiles: [new Error("private detail")] });
    const response = await GET(request(query));
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).toBe("Failed to list users");
  });

  it.each([401, 403])("keeps admin auth failure %s ahead of persistence", async status => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthError("Denied", status));
    const response = await GET(request());
    expect(response.status).toBe(status);
    expect((await response.json()).error).toEqual({ code: "auth", message: "Denied" });
    expect(createServiceSupabase).not.toHaveBeenCalled();
  });

  it("returns configured guard before auth", async () => {
    vi.mocked(isSupabaseAdminConfigured).mockReturnValue(false);
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("supabase_not_configured");
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(createServiceSupabase).not.toHaveBeenCalled();
  });
});
