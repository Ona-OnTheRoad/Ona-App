import { describe, expect, it, vi } from "vitest";
import { createSnapshotReads, snapshotCanReplace } from "../snapshot-reads";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

describe("snapshot lanes", () => {
  it("shares only equivalent in-flight work and releases settled entries", async () => {
    const lanes = createSnapshotReads();
    const first = deferred<number>();
    const read = vi.fn(() => first.promise);
    const a = lanes.read("job:a", read);
    expect(lanes.read("job:a", read)).toBe(a);
    expect(await lanes.read("requests", async () => 7)).toBe(7);
    first.resolve(1); expect(await a).toBe(1);
    expect(await lanes.read("job:a", async () => 2)).toBe(2);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("coalesces invalidations into one follow-up and retains changes during that read", async () => {
    const lanes = createSnapshotReads();
    const first = deferred<number>(); const second = deferred<number>();
    const read = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockResolvedValue(3);
    const a = lanes.read("job", read);
    const b = lanes.read("job", read, true);
    expect(lanes.read("job", read, true)).toBe(b);
    expect(lanes.read("job", read)).toBe(a);
    first.resolve(1); await a;
    const c = lanes.read("job", read, true);
    expect(c).not.toBe(b);
    second.resolve(2); expect(await b).toBe(2); expect(await c).toBe(3);
    expect(read).toHaveBeenCalledTimes(3);
  });

  it("starts queued recovery after failure and permits future retries", async () => {
    const lanes = createSnapshotReads(); const first = deferred<number>();
    const a = lanes.read("job", () => first.promise);
    const error = expect(a).rejects.toThrow("offline");
    const b = lanes.read("job", async () => 2, true);
    first.reject(new Error("offline")); await error;
    expect(await b).toBe(2);
    expect(await lanes.read("job", async () => 3)).toBe(3);
  });

  it("does not start queued work after its last owner disposes", async () => {
    const lanes = createSnapshotReads(); const first = deferred<number>();
    const a = lanes.read("job", () => first.promise);
    await Promise.resolve();
    const follow = vi.fn(async () => 2);
    const b = lanes.read("job", follow, true);
    const error = expect(b).rejects.toThrow("scope ended");
    lanes.dispose(); first.resolve(1); await a; await error;
    expect(follow).not.toHaveBeenCalled();
    await expect(lanes.read("job", follow)).rejects.toThrow("scope ended");
  });
});

describe("snapshot revision guards", () => {
  it("rejects lower/missing revisions regardless of timestamps and accepts higher revisions", () => {
    const current = { id: "j", jobVersion: 8 };
    expect(snapshotCanReplace({ id: "j", jobVersion: 7 }, current, current)).toBe(false);
    expect(snapshotCanReplace({ id: "j" }, current, current)).toBe(false);
    expect(snapshotCanReplace({ id: "j", jobVersion: 9 }, current, null)).toBe(true);
  });
  it("does not overwrite intervening equal-version or unversioned mutation results", () => {
    const current = { id: "j", jobVersion: 8 };
    expect(snapshotCanReplace({ ...current }, current, { ...current })).toBe(false);
    expect(snapshotCanReplace({ ...current }, current, current)).toBe(true);
    expect(snapshotCanReplace({ id: "j" }, { id: "j" }, null)).toBe(false);
  });
});
