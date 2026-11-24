/**
 * The two profile routes that used to accept a client liveness claim must no
 * longer write Tier 3 flags (only /api/liveness/verify may).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/test-utils/fake-supabase";

const mocks = vi.hoisted(() => ({
  service: vi.fn(), getUser: vi.fn(), recompute: vi.fn(), audit: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/server/auth-utils", () => ({
  getUserFromRequest: async () => ({ id: "00000000-0000-4000-8000-000000000001" }),
  requireUser: async () => ({ ok: true, userId: "00000000-0000-4000-8000-000000000001" }),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: mocks.service }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true,
  getSupabaseUrl: () => "https://example.test",
  getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/pro-visibility", () => ({ recomputeProVisibility: mocks.recompute }));
vi.mock("@/lib/server/modules/platform-audit", () => ({ writePlatformAudit: mocks.audit }));

import { POST as profileUpdate } from "@/app/api/profile/update/route";
import { PATCH as artisanPatch } from "@/app/api/artisan/profile/route";

const USER = "00000000-0000-4000-8000-000000000001";

function setup() {
  const sb = new FakeSupabase({
    profiles: [{ id: USER, role: "repair_pro", full_name: "Ada Pro", phone: "+2348000000001" }],
    repair_pro_profiles: [{
      user_id: USER, services: ["mechanic"], primary_service: "mechanic",
      face_liveness_verified: false, face_liveness_at: null, liveness_passed_at: null,
      pipeline_status: "draft",
    }],
  });
  mocks.service.mockReturnValue(sb);
  return sb;
}
const liveness = (sb: FakeSupabase) => {
  const r = sb.rows.repair_pro_profiles[0];
  return [r.face_liveness_verified, r.face_liveness_at, r.liveness_passed_at];
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
  mocks.audit.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("liveness forge paths are closed", () => {
  it("POST /api/profile/update ignores faceLivenessVerified", async () => {
    const sb = setup();
    const res = await profileUpdate(new Request("https://ona.test/api/profile/update", {
      method: "POST",
      body: JSON.stringify({ access_token: "valid-access-token", faceLivenessVerified: true, businessName: "Ada Fix" }),
    }));
    expect(res.status).toBe(200);
    expect(sb.rows.repair_pro_profiles[0].business_name).toBe("Ada Fix");
    expect(liveness(sb)).toEqual([false, null, null]);
    expect(mocks.recompute).not.toHaveBeenCalled();
  });

  it("PATCH /api/artisan/profile ignores livenessPassedAt", async () => {
    const sb = setup();
    const res = await artisanPatch(new Request("https://ona.test/api/artisan/profile", {
      method: "PATCH",
      body: JSON.stringify({
        access_token: "valid-access-token", userId: USER, bio: "Engines", livenessPassedAt: "2026-11-23T00:00:00.000Z",
      }),
    }));
    expect(res.status).toBe(200);
    expect(sb.rows.repair_pro_profiles[0].bio).toBe("Engines");
    expect(liveness(sb)).toEqual([false, null, null]);
    expect(mocks.recompute).not.toHaveBeenCalled();
  });
});
