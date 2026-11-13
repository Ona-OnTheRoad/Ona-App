import "server-only";
import { createHmac } from "node:crypto";
import type { PremblyVerifyOk } from "@/lib/server/prembly";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

/**
 * Outage fallback for NIN lookups (table `id_lookup_cache`, migration 084).
 * Only live confirmations are stored. The key is a keyed hash, so neither the
 * key nor the value holds the NIN. Every failure here is swallowed: the cache
 * must never break a lookup.
 */
const TABLE = "id_lookup_cache";
const DEFAULT_TTL_DAYS = 30;

function secret(): string {
  return (
    process.env.ID_LOOKUP_CACHE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

export function ninCacheTtlMs(): number {
  const days = Number(process.env.ID_LOOKUP_CACHE_TTL_DAYS);
  return (Number.isFinite(days) && days > 0 ? days : DEFAULT_TTL_DAYS) * 86_400_000;
}

/**
 * HMAC rather than a plain hash: an 11-digit number has too few possible
 * values for an unkeyed hash to hide it. Null when no secret is available.
 */
export function ninCacheKey(nin: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(`nin:${nin.replace(/\D/g, "")}`).digest("hex");
}

type CachedNin = Pick<
  PremblyVerifyOk,
  "reference" | "fullName" | "firstName" | "lastName" | "rawStatus"
>;

export async function writeNinCache(nin: string, result: PremblyVerifyOk): Promise<void> {
  try {
    const keyHash = ninCacheKey(nin);
    if (!keyHash || !isSupabaseAdminConfigured()) return;
    if (result.mode !== "live" || result.cached) return;
    const sb = createServiceSupabase();
    const now = new Date();
    const stored: CachedNin = {
      reference: result.reference,
      fullName: result.fullName,
      firstName: result.firstName,
      lastName: result.lastName,
      rawStatus: result.rawStatus,
    };
    await sb.from(TABLE).delete().lt("expires_at", now.toISOString());
    await sb.from(TABLE).upsert(
      {
        key_hash: keyHash,
        kind: "nin",
        result: stored,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + ninCacheTtlMs()).toISOString(),
      },
      { onConflict: "key_hash" },
    );
  } catch {
    /* cache is best-effort */
  }
}

export async function readNinCache(nin: string): Promise<PremblyVerifyOk | null> {
  try {
    const keyHash = ninCacheKey(nin);
    if (!keyHash || !isSupabaseAdminConfigured()) return null;
    const { data, error } = await createServiceSupabase()
      .from(TABLE)
      .select("result, expires_at")
      .eq("key_hash", keyHash)
      .maybeSingle();
    if (error || !data) return null;
    if (new Date(String(data.expires_at)).getTime() <= Date.now()) return null;
    const stored = (data.result || {}) as CachedNin;
    return {
      ok: true,
      provider: "prembly",
      mode: "live",
      reference: stored.reference,
      fullName: stored.fullName,
      firstName: stored.firstName,
      lastName: stored.lastName,
      rawStatus: stored.rawStatus,
      cached: true,
    };
  } catch {
    return null;
  }
}
