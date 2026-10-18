// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clearLivenessFails, getLivenessLock, recordLivenessFail, LIVENESS_LOCKOUT_MS } from "../lockout";

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-18T12:00:00Z")); });
afterEach(() => vi.useRealTimers());

it("locks on the sixth failure for one minute then resets", () => {
  for (let i = 1; i < 6; i++) expect(recordLivenessFail("pro").locked).toBe(false);
  expect(recordLivenessFail("pro")).toEqual({ locked: true, fails: 6, remainingMs: 60_000 });
  expect(LIVENESS_LOCKOUT_MS).toBe(60_000);
  vi.advanceTimersByTime(59_999);
  expect(getLivenessLock("pro").remainingMs).toBe(1);
  vi.advanceTimersByTime(1);
  expect(getLivenessLock("pro")).toEqual({ locked: false, fails: 0, remainingMs: 0 });
});

it.each([0, 30_000, 120_000])("shortens an old lock after %i ms without restarting it", (elapsed) => {
  const start = Date.now();
  localStorage.setItem("ona-liveness-attempts-v1:pro", JSON.stringify({ fails: 6, lockUntil: start + 30 * 60_000 }));
  vi.advanceTimersByTime(elapsed);
  expect(getLivenessLock("pro").remainingMs).toBe(Math.max(0, 60_000 - elapsed));
  expect(getLivenessLock("pro").locked).toBe(elapsed < 60_000);
});

it("does not extend a lock already within one minute", () => {
  localStorage.setItem("ona-liveness-attempts-v1:pro", JSON.stringify({ fails: 6, lockUntil: Date.now() + 10_000 }));
  expect(getLivenessLock("pro").remainingMs).toBe(10_000);
});

it("keeps users isolated and clears failures on success", () => {
  for (let i = 0; i < 6; i++) recordLivenessFail("pro");
  expect(getLivenessLock("other").locked).toBe(false);
  clearLivenessFails("pro");
  expect(getLivenessLock("pro")).toEqual({ locked: false, fails: 0, remainingMs: 0 });
});
