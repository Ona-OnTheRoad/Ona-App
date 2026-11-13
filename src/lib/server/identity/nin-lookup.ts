import "server-only";
import { readNinCache, writeNinCache } from "@/lib/server/identity/nin-cache";
import {
  isProviderOutage,
  verifyNinWithPrembly,
  type PremblyVerifyResult,
} from "@/lib/server/prembly";

/**
 * NIN lookup with an outage fallback. The provider is always asked first.
 * A live confirmation is remembered; when the provider cannot answer, an
 * unexpired earlier confirmation of the same NIN is returned with
 * `cached: true`. A rejection or a missing provider key never uses the cache.
 */
export async function verifyNinWithFallback(nin: string): Promise<PremblyVerifyResult> {
  const result = await verifyNinWithPrembly(nin);
  if (result.ok) {
    await writeNinCache(nin, result);
    return result;
  }
  if (!isProviderOutage(result)) return result;
  return (await readNinCache(nin)) ?? result;
}
