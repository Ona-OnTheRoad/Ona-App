import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildIdLookupRecord,
  idLookupSummary,
  lookupId,
  mergeIdLookup,
} from "@/lib/server/identity/id-lookup";
import { checkSignupIds, storeIdLookup } from "@/lib/server/identity/signup-id-check";
import { idKindForGovId } from "@/lib/server/identity/submission-lookup";
import { verifyBvnWithPrembly, verifyNinWithPrembly } from "@/lib/server/prembly";
import { FakeSupabase } from "@/test-utils/fake-supabase";

vi.mock("@/lib/server/prembly", async (original) => ({
  ...(await original<typeof import("@/lib/server/prembly")>()),
  verifyNinWithPrembly: vi.fn(),
  verifyBvnWithPrembly: vi.fn(),
}));

const NIN = "12345678901";
const BVN = "22345678901";
const live = {
  ok: true as const, provider: "prembly" as const, mode: "live" as const, reference: "ref-9",
  fullName: "Adaeze Ngozi Okafor", firstName: "Adaeze", lastName: "Okafor",
};
const fail = (code: string) => ({
  ok: false as const, provider: "prembly" as const, mode: "live" as const, message: "x", code,
});
const NOW = new Date("2026-11-13T10:00:00.000Z");

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("buildIdLookupRecord", () => {
  it("records a live confirmation with the name comparison and no ID number", () => {
    const record = buildIdLookupRecord("bvn", live, {
      profileName: "Adaeze Okafor", bankAccountName: "CHIDI BELLO",
    }, NOW);

    expect(record).toEqual({
      kind: "bvn", status: "verified", provider: "prembly", mode: "live",
      reference: "ref-9", matchedName: "Adaeze Ngozi Okafor", code: null,
      checkedAt: "2026-11-13T10:00:00.000Z",
      nameMatch: { profile: "match", bankAccount: "mismatch" },
    });
    expect(JSON.stringify(record)).not.toContain(BVN);
  });

  it("marks a format-only pass and compares no names", () => {
    const record = buildIdLookupRecord("nin", {
      ok: true, provider: "local", mode: "sandbox_format", reference: "local-nin-8901",
    }, { profileName: "Adaeze Okafor" }, NOW);
    expect(record.status).toBe("format_only");
    expect(record.nameMatch).toEqual({ profile: "unknown", bankAccount: "unknown" });
  });

  it.each([
    ["NOT_CONFIGURED", "unavailable"], ["NETWORK", "unavailable"], ["503", "unavailable"],
    ["401", "unavailable"], ["429", "unavailable"], ["01", "rejected"], ["FORMAT", "rejected"],
    ["404", "rejected"],
  ])("classifies failure code %s as %s", (code, status) => {
    expect(buildIdLookupRecord("nin", fail(code), {}, NOW).status).toBe(status);
  });
});

describe("lookupId", () => {
  it("treats a thrown provider call as unavailable", async () => {
    vi.mocked(verifyNinWithPrembly).mockRejectedValue(new Error("boom"));
    expect((await lookupId("nin", NIN)).status).toBe("unavailable");
  });
});

describe("mergeIdLookup and idLookupSummary", () => {
  it("adds records under idLookup and keeps the rest of the meta", () => {
    const first = buildIdLookupRecord("nin", live, { profileName: "Adaeze Okafor" }, NOW);
    const second = buildIdLookupRecord("bvn", live, { profileName: "Chidi Bello" }, NOW);
    const meta = mergeIdLookup(mergeIdLookup({ primaryLast4: "8901" }, [first]), [second]);

    expect(meta.primaryLast4).toBe("8901");
    expect(idLookupSummary(meta)).toEqual({ nin: first, bvn: second, name_mismatch: true });
    expect(idLookupSummary(mergeIdLookup({}, [first])).name_mismatch).toBe(false);
    expect(idLookupSummary(null)).toEqual({ nin: null, bvn: null, name_mismatch: false });
    expect(mergeIdLookup("not-an-object", [])).toEqual({});
  });
});

describe("checkSignupIds", () => {
  it("looks up only complete numbers and returns the records", async () => {
    vi.mocked(verifyNinWithPrembly).mockResolvedValue(live);
    const out = await checkSignupIds({ nin: NIN, bvn: "123", profileName: "Adaeze Okafor" });

    expect(out.ok && out.records.map((r) => [r.kind, r.status, r.nameMatch.profile]))
      .toEqual([["nin", "verified", "match"]]);
    expect(verifyNinWithPrembly).toHaveBeenCalledWith(NIN);
    expect(verifyBvnWithPrembly).not.toHaveBeenCalled();
  });

  it("stops signup on a provider rejection", async () => {
    vi.mocked(verifyNinWithPrembly).mockResolvedValue(live);
    vi.mocked(verifyBvnWithPrembly).mockResolvedValue(fail("01"));
    expect(await checkSignupIds({ nin: NIN, bvn: BVN })).toMatchObject({
      ok: false, status: 422, code: "id_verification_failed",
    });
  });

  it("stops signup when the provider cannot be asked", async () => {
    vi.mocked(verifyNinWithPrembly).mockResolvedValue(fail("NOT_CONFIGURED"));
    expect(await checkSignupIds({ nin: NIN })).toMatchObject({
      ok: false, status: 503, code: "id_verification_unavailable",
    });
  });

  it("lets a name mismatch through for Care to review", async () => {
    vi.mocked(verifyBvnWithPrembly).mockResolvedValue(live);
    const out = await checkSignupIds({ bvn: BVN, profileName: "Chidi Bello" });
    expect(out.ok && out.records[0].nameMatch.profile).toBe("mismatch");
  });

  it("does nothing when no number is given", async () => {
    expect(await checkSignupIds({})).toEqual({ ok: true, records: [] });
    expect(verifyNinWithPrembly).not.toHaveBeenCalled();
  });
});

describe("storeIdLookup", () => {
  it("merges the records into the row's gov_id_meta", async () => {
    const sb = new FakeSupabase({
      motorist_profiles: [{ user_id: "u1", gov_id_meta: { primaryLast4: "8901" } }],
    });
    const record = buildIdLookupRecord("nin", live, {}, NOW);

    await storeIdLookup(sb as never, "motorist_profiles", "u1", [record]);

    expect(sb.rows.motorist_profiles[0].gov_id_meta).toEqual({
      primaryLast4: "8901", idLookup: { nin: record },
    });
  });

  it("never throws when the write fails", async () => {
    const broken = { from: () => { throw new Error("db down"); } };
    await expect(
      storeIdLookup(broken as never, "repair_pro_profiles", "u1", [
        buildIdLookupRecord("bvn", live, {}, NOW),
      ]),
    ).resolves.toBeUndefined();
  });
});

describe("idKindForGovId", () => {
  it("maps only Nigerian 11-digit NIN and BVN submissions", () => {
    expect(idKindForGovId("national_id", NIN)).toBe("nin");
    expect(idKindForGovId("NIN", NIN, "ng")).toBe("nin");
    expect(idKindForGovId("bvn", BVN)).toBe("bvn");
    expect(idKindForGovId("passport", NIN)).toBeNull();
    expect(idKindForGovId("national_id", "A1234567")).toBeNull();
    expect(idKindForGovId("national_id", NIN, "GH")).toBeNull();
    expect(idKindForGovId("bvn", "")).toBeNull();
  });
});
