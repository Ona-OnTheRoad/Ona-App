import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const mocks = vi.hoisted(() => ({
  service: vi.fn(), getUser: vi.fn(), verifyNin: vi.fn(), verifyBvn: vi.fn(), mergeDetect: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: mocks.service }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true, getSupabaseUrl: () => "https://example.test", getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/prembly", async (original) => ({
  ...(await original<typeof import("@/lib/server/prembly")>()),
  verifyNinWithPrembly: mocks.verifyNin, verifyBvnWithPrembly: mocks.verifyBvn,
}));
vi.mock("@/lib/server/identity/identity-sync", () => ({
  detectMergeCandidatesForUser: mocks.mergeDetect,
}));
import { POST as customerId } from "@/app/api/verify/customer-id/route";
import { POST as proId } from "@/app/api/verify/pro-id/route";

const NIN = "12345678901";
const BVN = "22345678901";
const live = {
  ok: true, provider: "prembly", mode: "live", reference: "ref-7",
  fullName: "Ada Ngozi User", firstName: "Ada", lastName: "User",
};
const profiles = () => [{ id: "user-1", full_name: "Ada User", email: "ada@ona.test", phone: "+2348000000001" }];

function setup(tables: Record<string, Row[]>) {
  const sb = new FakeSupabase(tables);
  mocks.service.mockReturnValue(sb);
  return sb;
}
function post(handler: (req: Request) => Promise<Response>, path: string, body: Record<string, unknown>) {
  return handler(new Request(`https://ona.test/api/verify/${path}`, {
    method: "POST", body: JSON.stringify({ access_token: "valid-access-token", ...body }),
  }));
}
type Meta = { idLookup?: Record<string, Record<string, unknown>> } & Record<string, unknown>;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mocks.mergeDetect.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/verify/pro-id", () => {
  it("writes the BVN step to the BVN fields only and records the lookup", async () => {
    const sb = setup({
      profiles: profiles(),
      repair_pro_profiles: [{
        user_id: "user-1", status: "pending", nin_encrypted: NIN, nin_last4: "8901",
        gov_id_number: NIN, bank_account_name: "CHIDI BELLO",
        gov_id_meta: { primaryId: NIN, primaryLast4: "8901" },
      }],
    });
    mocks.verifyBvn.mockResolvedValue(live);

    const res = await post(proId, "pro-id", { kind: "nin", nin: BVN });

    expect(res.status).toBe(200);
    const row = sb.rows.repair_pro_profiles[0];
    expect(row).toMatchObject({
      bvn_encrypted: BVN, bvn_last4: "8901", bank_id_number: BVN, bvn_verified: false,
      nin_encrypted: NIN, nin_last4: "8901", gov_id_number: NIN,
    });
    const meta = row.gov_id_meta as Meta;
    expect(meta).toMatchObject({ primaryId: NIN, bankId: BVN });
    expect(meta.nin).toBeUndefined();
    expect(mocks.verifyBvn).toHaveBeenCalledWith(BVN);
    expect(mocks.verifyNin).not.toHaveBeenCalled();
    expect(meta.idLookup?.bvn).toMatchObject({
      status: "verified", matchedName: "Ada Ngozi User",
      nameMatch: { profile: "match", bankAccount: "mismatch" },
    });
  });

  it("records a NIN lookup for a national ID submission without marking it verified", async () => {
    const sb = setup({ profiles: profiles(), repair_pro_profiles: [{ user_id: "user-1", status: "pending" }] });
    mocks.verifyNin.mockResolvedValue(live);

    const res = await post(proId, "pro-id", {
      kind: "gov_id", govIdKind: "national_id", govIdNumber: NIN, govIdFrontUrl: "data:image/png;base64,AAAA",
    });

    expect(res.status).toBe(200);
    const row = sb.rows.repair_pro_profiles[0];
    expect(row).toMatchObject({ nin_verified: false, verified: false, gov_id_review_status: "submitted" });
    expect((row.gov_id_meta as Meta).idLookup?.nin).toMatchObject({ status: "verified", reference: "ref-7" });
  });

  it("still accepts the submission when the provider refuses or cannot be asked", async () => {
    const sb = setup({ profiles: profiles(), repair_pro_profiles: [{ user_id: "user-1", status: "pending" }] });
    mocks.verifyBvn.mockResolvedValue({ ok: false, provider: "prembly", mode: "live", message: "no record", code: "01" });

    const res = await post(proId, "pro-id", { kind: "nin", nin: BVN });

    expect(res.status).toBe(200);
    expect((sb.rows.repair_pro_profiles[0].gov_id_meta as Meta).idLookup?.bvn).toMatchObject({
      status: "rejected", matchedName: null,
    });
  });

  it("makes no provider call for a passport", async () => {
    setup({ profiles: profiles(), repair_pro_profiles: [{ user_id: "user-1", status: "pending" }] });

    const res = await post(proId, "pro-id", {
      kind: "gov_id", govIdKind: "passport", govIdNumber: "A12345678", govIdFrontUrl: "data:image/png;base64,AAAA",
    });

    expect(res.status).toBe(200);
    expect(mocks.verifyNin).not.toHaveBeenCalled();
    expect(mocks.verifyBvn).not.toHaveBeenCalled();
  });
});

describe("POST /api/verify/customer-id", () => {
  it("records NIN and BVN lookups for a Nigerian submission and leaves it for Care", async () => {
    const sb = setup({ profiles: profiles(), motorist_profiles: [{ user_id: "user-1" }] });
    mocks.verifyNin.mockResolvedValue(live);
    mocks.verifyBvn.mockResolvedValue({ ...live, fullName: "Chidi Bello", firstName: "Chidi", lastName: "Bello" });

    const res = await post(customerId, "customer-id", {
      primaryId: NIN, bankId: BVN, countryIso: "NG", govIdKind: "national_id",
      govIdFrontUrl: "data:image/png;base64,AAAA",
    });

    expect(res.status).toBe(200);
    const row = sb.rows.motorist_profiles[0];
    expect(row).toMatchObject({ nin_verified: false, bvn_verified: false, identity_review_status: "submitted" });
    const lookup = (row.gov_id_meta as Meta).idLookup;
    expect(lookup?.nin).toMatchObject({ status: "verified", nameMatch: { profile: "match" } });
    expect(lookup?.bvn).toMatchObject({ status: "verified", nameMatch: { profile: "mismatch" } });
  });

  it("makes no provider call for a non-Nigerian ID", async () => {
    setup({ profiles: profiles(), motorist_profiles: [{ user_id: "user-1" }] });

    const res = await post(customerId, "customer-id", {
      primaryId: NIN, countryIso: "GH", govIdKind: "national_id", govIdFrontUrl: "data:image/png;base64,AAAA",
    });

    expect(res.status).toBe(200);
    expect(mocks.verifyNin).not.toHaveBeenCalled();
  });
});
