import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/types";
import {
  PROFILE_CACHE_TTL_MS,
  invalidateProfileCache,
  loadProfileCached,
} from "./profile-cache";

const profile = (name: string) => ({ fullName: name }) as unknown as UserProfile;

beforeEach(() => invalidateProfileCache());

describe("loadProfileCached", () => {
  it("serves repeat reads from memory and fetches once", async () => {
    const fetcher = vi.fn(async () => profile("Ada"));
    await loadProfileCached("u1", fetcher);
    await loadProfileCached("u1", fetcher);
    await loadProfileCached("u1", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("shares one request between concurrent callers", async () => {
    let release!: (p: UserProfile) => void;
    const fetcher = vi.fn(() => new Promise<UserProfile | null>((r) => (release = r)));
    const a = loadProfileCached("u1", fetcher);
    const b = loadProfileCached("u1", fetcher);
    release(profile("Ada"));
    expect(await a).toBe(await b);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refetches when forced, when stale, for another user, or after invalidation", async () => {
    const fetcher = vi.fn(async () => profile("Ada"));
    let t = 1_000;
    const now = () => t;
    await loadProfileCached("u1", fetcher, { now });
    await loadProfileCached("u1", fetcher, { now, force: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
    t += PROFILE_CACHE_TTL_MS + 1;
    await loadProfileCached("u1", fetcher, { now });
    expect(fetcher).toHaveBeenCalledTimes(3);
    await loadProfileCached("u2", fetcher, { now });
    expect(fetcher).toHaveBeenCalledTimes(4);
    invalidateProfileCache();
    await loadProfileCached("u2", fetcher, { now });
    expect(fetcher).toHaveBeenCalledTimes(5);
  });

  it("does not cache failures", async () => {
    const fetcher = vi.fn(async () => null);
    await loadProfileCached("u1", fetcher);
    await loadProfileCached("u1", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not cache a response that was in flight when the cache was invalidated", async () => {
    let release!: (p: UserProfile) => void;
    const slow = vi.fn(() => new Promise<UserProfile | null>((r) => (release = r)));
    const pending = loadProfileCached("u1", slow);
    invalidateProfileCache();
    release(profile("stale"));
    await pending;
    const fresh = vi.fn(async () => profile("fresh"));
    expect((await loadProfileCached("u1", fresh))?.fullName).toBe("fresh");
  });
});
