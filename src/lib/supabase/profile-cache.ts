import type { UserProfile } from "@/lib/types";

/**
 * In-memory cache for the signed-in user's own profile (GET /api/profile).
 *
 * The profile carries bank details and NIN/BVN, so it is deliberately held in
 * memory only, never in local/session storage. Concurrent callers share one
 * request, and anything that changes the profile must call
 * `invalidateProfileCache()` so the next read refetches.
 */
export const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

type Entry = { userId: string; at: number; profile: UserProfile | null };

let entry: Entry | null = null;
let inflight: { userId: string; promise: Promise<UserProfile | null> } | null =
  null;
/** Bumped on invalidate so a response that was in flight is not cached. */
let epoch = 0;

export function invalidateProfileCache(): void {
  entry = null;
  inflight = null;
  epoch++;
}

export async function loadProfileCached(
  userId: string,
  fetcher: () => Promise<UserProfile | null>,
  opts?: { force?: boolean; now?: () => number },
): Promise<UserProfile | null> {
  const now = opts?.now ?? Date.now;
  if (!opts?.force) {
    if (
      entry &&
      entry.userId === userId &&
      entry.profile &&
      now() - entry.at < PROFILE_CACHE_TTL_MS
    ) {
      return entry.profile;
    }
    if (inflight && inflight.userId === userId) return inflight.promise;
  }

  const startedAt = epoch;
  const promise = fetcher().then((profile) => {
    // Only successful loads are cached, and never across an invalidation.
    if (profile && startedAt === epoch) {
      entry = { userId, at: now(), profile };
    }
    return profile;
  });
  const slot = { userId, promise };
  inflight = slot;
  void promise
    .catch(() => null)
    .finally(() => {
      if (inflight === slot) inflight = null;
    });
  return promise;
}
