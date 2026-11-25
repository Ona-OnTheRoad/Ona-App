import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitUntil } from "@/lib/wait-for-route";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("waitUntil", () => {
  it("resolves immediately when already true", async () => {
    await expect(waitUntil(() => true)).resolves.toBe(true);
  });
  it("resolves true as soon as the condition turns true", async () => {
    let ok = false;
    const p = waitUntil(() => ok);
    setTimeout(() => (ok = true), 100);
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toBe(true);
  });
  it("gives up after the timeout so a cover can never stay up forever", async () => {
    const p = waitUntil(() => false, { timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(1200);
    await expect(p).resolves.toBe(false);
  });
});
