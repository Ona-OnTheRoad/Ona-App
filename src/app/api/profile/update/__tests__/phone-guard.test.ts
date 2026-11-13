import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const h = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) } }),
}));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true,
  getSupabaseUrl: () => "http://localhost",
  getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => h.db }));
vi.mock("@/lib/server/payments/bank-lookup", () => ({ isBankAccountTaken: async () => false }));

import { POST } from "../route";

const STORED = "+2348012345678";
const profile = (over: Row = {}): Row => ({ id: "user-1", role: "motorist", full_name: "Ada", phone: STORED, phone_verified: true, city: "Lagos", ...over });
const seed = (profiles: Row[]) => { h.db = new FakeSupabase({ profiles, motorist_profiles: [{ user_id: "user-1" }] }); };
const stored = () => ((h.db as FakeSupabase).rows.profiles as Row[]).find((p) => p.id === "user-1")!;
const post = (body: Record<string, unknown>) =>
  POST(new Request("http://localhost/api/profile/update", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: "valid-access-token-123", ...body }),
  }));

beforeEach(() => seed([profile()]));

describe("POST /api/profile/update cannot be used to change a phone number", () => {
  it("ignores a different phone (a change needs identity proof + a code, via /api/security/action)", async () => {
    const res = await post({ phone: "+2348099999999", city: "Abuja" });
    expect(res.status).toBe(200);
    expect(stored().phone).toBe(STORED);
    expect(stored().phone_verified).toBe(true);
    // The rest of the save still goes through.
    expect(stored().city).toBe("Abuja");
  });

  it("is a no-op for the unchanged phone the app sends on every save", async () => {
    const res = await post({ phone: STORED, city: "Ikeja" });
    expect(res.status).toBe(200);
    expect(stored()).toMatchObject({ phone: STORED, phone_verified: true, city: "Ikeja" });
  });

  it("ignores the same number typed in another format as well", async () => {
    expect((await post({ phone: "0801 234 5678" })).status).toBe(200);
    expect(stored().phone).toBe(STORED);
  });

  it("still lets an account that has no phone yet set one (canonical form), never marking it verified", async () => {
    seed([profile({ phone: null, phone_verified: undefined })]);
    const res = await post({ phone: "0807 777 7777" });
    expect(res.status).toBe(200);
    expect(stored().phone).toBe("+2348077777777");
    expect(stored().phone_verified).toBeUndefined();
  });

  it("refuses to fill in a missing phone with a number another account already has", async () => {
    seed([profile({ phone: null }), { id: "user-2", role: "motorist", phone: "+2348077777777" }]);
    const res = await post({ phone: "08077777777" });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("phone_exists");
    expect(stored().phone).toBeNull();
  });

  it("an unparseable phone is ignored rather than written", async () => {
    seed([profile({ phone: null })]);
    expect((await post({ phone: "abc" })).status).toBe(200);
    expect(stored().phone).toBeNull();
  });
});
