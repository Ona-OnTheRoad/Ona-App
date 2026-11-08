import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/admin-auth", () => ({
  requireAdmin: vi.fn(),
  logAdminAction: vi.fn(),
  AdminAuthError: class extends Error {
    constructor(message: string, public status = 401) { super(message); }
  },
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/server/identity/dual-t2-mirror", () => ({ mirrorDualRoleT2Approved: vi.fn() }));
import { requireAdmin } from "@/lib/server/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { PATCH } from "@/app/api/admin/pro-review/route";

const USER = "11111111-1111-4111-8111-111111111111";

function db(before: Record<string, unknown> | null) {
  const updates: Record<string, unknown>[] = [];
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: before, error: null }) }) }),
    update: (patch: Record<string, unknown>) => {
      updates.push(patch);
      return { eq: async () => ({ error: null }) };
    },
  }));
  vi.mocked(createServiceSupabase).mockReturnValue({ from } as never);
  return updates;
}
const approve = () =>
  PATCH(new Request("https://ona.test/api/admin/pro-review", { method: "PATCH", body: JSON.stringify({ userId: USER, action: "pro_t2_approve" }) }));

const idOnly = { gov_id_number: "A1234567", gov_id_front_url: "https://img/front.jpg", gov_id_meta: {} };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireAdmin).mockResolvedValue({ session: { userId: "admin-1" } } as never);
});

describe("pro_t2_approve", () => {
  it("approves a non-NIN government ID without demanding a BVN", async () => {
    const updates = db({ ...idOnly });
    const res = await approve();
    expect(res.status).toBe(200);
    expect(updates[0]).toMatchObject({ nin_verified: true, verified: true, gov_id_review_status: "approved", visibility_tier: 2 });
  });

  it("does not mark the BVN verified when none was submitted", async () => {
    const updates = db({ ...idOnly });
    await approve();
    expect(updates[0].bvn_verified).toBe(false);
  });

  it("keeps a pro who already passed liveness at Tier 2 when no BVN is on file", async () => {
    const updates = db({ ...idOnly, face_liveness_verified: true });
    await approve();
    expect(updates[0]).toMatchObject({ bvn_verified: false, visibility_tier: 2, is_new_artisan: true });
    expect(updates[0]).not.toHaveProperty("tier3_approved_at");
  });

  it("reaches Tier 3 only when liveness passed and a BVN is on file", async () => {
    const updates = db({ ...idOnly, face_liveness_verified: true, bvn_last4: "8901" });
    await approve();
    expect(updates[0]).toMatchObject({ bvn_verified: true, visibility_tier: 3, is_new_artisan: false, go_live_window_ends_at: null });
  });

  it("never takes away an already verified BVN", async () => {
    const updates = db({ ...idOnly, bvn_verified: true });
    await approve();
    expect(updates[0].bvn_verified).toBe(true);
  });

  it("still refuses when the government ID itself is missing", async () => {
    db({ gov_id_meta: {} });
    expect((await approve()).status).toBe(400);
  });
});
