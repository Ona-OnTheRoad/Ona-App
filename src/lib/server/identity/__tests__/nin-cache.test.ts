import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ninCacheKey, readNinCache, writeNinCache } from "@/lib/server/identity/nin-cache";
import { verifyNinWithFallback } from "@/lib/server/identity/nin-lookup";
import { verifyNinWithPrembly } from "@/lib/server/prembly";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
vi.mock("@/lib/server/prembly", async (original) => ({
  ...(await original<typeof import("@/lib/server/prembly")>()),
  verifyNinWithPrembly: vi.fn(),
}));

const NIN = "12345678901";
const live = {
  ok: true as const, provider: "prembly" as const, mode: "live" as const, reference: "ref-3",
  fullName: "Adaeze Ngozi Okafor", firstName: "Adaeze", lastName: "Okafor", phone: "+2348000000001",
  rawStatus: "VERIFIED",
};
const outage = { ok: false as const, provider: "prembly" as const, mode: "live" as const, message: "down", code: "NETWORK" };

type CacheRow = { key_hash: string; kind: string; result: unknown; created_at: string; expires_at: string };

/** Just enough of the query builder for the cache table. */
function fakeCacheDb(rows: CacheRow[] = []) {
  const state = { rows, table: "" };
  const from = (table: string) => {
    state.table = table;
    return {
      delete: () => ({
        lt: async (_col: string, iso: string) => {
          state.rows = state.rows.filter((r) => r.expires_at >= iso);
          return { error: null };
        },
      }),
      upsert: async (row: CacheRow) => {
        state.rows = [...state.rows.filter((r) => r.key_hash !== row.key_hash), row];
        return { error: null };
      },
      select: () => ({
        eq: (_col: string, key: string) => ({
          maybeSingle: async () => ({ data: state.rows.find((r) => r.key_hash === key) ?? null, error: null }),
        }),
      }),
    };
  };
  vi.mocked(createServiceSupabase).mockReturnValue({ from } as never);
  return state;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isSupabaseAdminConfigured).mockReturnValue(true);
  vi.stubEnv("ID_LOOKUP_CACHE_SECRET", "unit-test-secret");
  vi.stubEnv("ID_LOOKUP_CACHE_TTL_DAYS", "");
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("ninCacheKey", () => {
  it("is a keyed hash that does not contain the number", () => {
    const key = ninCacheKey(NIN);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain(NIN);
    expect(ninCacheKey("123-4567-8901")).toBe(key);
    vi.stubEnv("ID_LOOKUP_CACHE_SECRET", "another-secret");
    expect(ninCacheKey(NIN)).not.toBe(key);
  });

  it("is off when no secret is available", async () => {
    vi.stubEnv("ID_LOOKUP_CACHE_SECRET", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const db = fakeCacheDb();

    expect(ninCacheKey(NIN)).toBeNull();
    await writeNinCache(NIN, live);
    expect(db.rows).toEqual([]);
    expect(await readNinCache(NIN)).toBeNull();
  });
});

describe("NIN lookup with outage fallback", () => {
  it("caches a live confirmation without the number or the phone, with an expiry", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-13T10:00:00.000Z") });
    const db = fakeCacheDb();
    vi.mocked(verifyNinWithPrembly).mockResolvedValue(live);

    expect(await verifyNinWithFallback(NIN)).toEqual(live);

    expect(db.table).toBe("id_lookup_cache");
    expect(db.rows).toEqual([{
      key_hash: ninCacheKey(NIN), kind: "nin",
      result: { reference: "ref-3", fullName: "Adaeze Ngozi Okafor", firstName: "Adaeze", lastName: "Okafor", rawStatus: "VERIFIED" },
      created_at: "2026-11-13T10:00:00.000Z", expires_at: "2026-12-13T10:00:00.000Z",
    }]);
    expect(JSON.stringify(db.rows)).not.toContain(NIN);
  });

  it("serves the cached confirmation, marked cached, while the provider is down", async () => {
    fakeCacheDb();
    vi.mocked(verifyNinWithPrembly).mockResolvedValueOnce(live).mockResolvedValue(outage);
    await verifyNinWithFallback(NIN);

    expect(await verifyNinWithFallback(NIN)).toEqual({
      ok: true, provider: "prembly", mode: "live", reference: "ref-3",
      fullName: "Adaeze Ngozi Okafor", firstName: "Adaeze", lastName: "Okafor",
      rawStatus: "VERIFIED", cached: true,
    });
  });

  it("returns the outage when the NIN was never confirmed before", async () => {
    fakeCacheDb();
    vi.mocked(verifyNinWithPrembly).mockResolvedValue(outage);
    expect(await verifyNinWithFallback(NIN)).toEqual(outage);
  });

  it("ignores an expired entry and removes it on the next write", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-13T10:00:00.000Z") });
    vi.stubEnv("ID_LOOKUP_CACHE_TTL_DAYS", "1");
    const db = fakeCacheDb();
    vi.mocked(verifyNinWithPrembly).mockResolvedValueOnce(live).mockResolvedValue(outage);
    await verifyNinWithFallback(NIN);
    expect(db.rows[0].expires_at).toBe("2026-11-14T10:00:00.000Z");

    vi.setSystemTime(new Date("2026-11-14T10:00:01.000Z"));
    expect(await verifyNinWithFallback(NIN)).toEqual(outage);

    await writeNinCache("99999999999", live);
    expect(db.rows.map((r) => r.key_hash)).toEqual([ninCacheKey("99999999999")]);
  });

  it.each([
    ["a provider rejection", "01"], ["a missing provider key", "NOT_CONFIGURED"],
    ["an auth error", "401"], ["a billing error", "402"],
  ])("never falls back to the cache on %s", async (_label, code) => {
    fakeCacheDb();
    vi.mocked(verifyNinWithPrembly).mockResolvedValueOnce(live).mockResolvedValue({ ...outage, code });
    await verifyNinWithFallback(NIN);

    expect(await verifyNinWithFallback(NIN)).toMatchObject({ ok: false, code });
  });

  it.each(["NETWORK", "408", "429", "500", "503"])("falls back on outage code %s", async (code) => {
    fakeCacheDb();
    vi.mocked(verifyNinWithPrembly).mockResolvedValueOnce(live).mockResolvedValue({ ...outage, code });
    await verifyNinWithFallback(NIN);

    expect(await verifyNinWithFallback(NIN)).toMatchObject({ ok: true, cached: true });
  });

  it("does not cache a format-only pass or a result that itself came from the cache", async () => {
    const db = fakeCacheDb();
    await writeNinCache(NIN, { ok: true, provider: "local", mode: "sandbox_format" });
    await writeNinCache(NIN, { ...live, cached: true });
    expect(db.rows).toEqual([]);
  });

  it("still answers when the cache store is broken or the database is not configured", async () => {
    vi.mocked(createServiceSupabase).mockImplementation(() => { throw new Error("db down"); });
    vi.mocked(verifyNinWithPrembly).mockResolvedValue(live);
    expect(await verifyNinWithFallback(NIN)).toEqual(live);
    vi.mocked(verifyNinWithPrembly).mockResolvedValue(outage);
    expect(await verifyNinWithFallback(NIN)).toEqual(outage);

    vi.mocked(isSupabaseAdminConfigured).mockReturnValue(false);
    expect(await readNinCache(NIN)).toBeNull();
  });
});
