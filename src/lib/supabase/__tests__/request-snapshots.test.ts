import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readRequestSnapshot } from "../request-snapshots";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/api-auth-headers", () => ({ authFetch: mocks.fetch }));
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
it("returns successful empty lists and preserves authentication/scope parameters", async () => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ ok: true, data: { requests: [] } })));
  expect(await readRequestSnapshot("A", "motorist")).toEqual([]);
  expect(mocks.fetch).toHaveBeenCalledWith("/api/requests?userId=A&role=motorist",
    expect.objectContaining({ method: "GET", cache: "no-store", signal: expect.any(AbortSignal) }), undefined);
  expect(vi.getTimerCount()).toBe(0);
});
it.each([
  [503, { ok: false, error: { message: "Unavailable" } }],
  [200, { ok: true, data: {} }],
  [401, { ok: false }],
])("does not turn an invalid HTTP %s response into an empty list", async (status, body) => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify(body), { status }));
  await expect(readRequestSnapshot("A", "motorist")).rejects.toThrow();
  expect(vi.getTimerCount()).toBe(0);
});
it("rejects malformed JSON and network errors", async () => {
  mocks.fetch.mockResolvedValueOnce(new Response("broken")).mockRejectedValueOnce(new Error("offline"));
  await expect(readRequestSnapshot("A", "motorist")).rejects.toThrow();
  await expect(readRequestSnapshot("A", "motorist")).rejects.toThrow("offline");
  expect(vi.getTimerCount()).toBe(0);
});
it("bounds a hung fetch and releases the timeout", async () => {
  mocks.fetch.mockImplementation((_url, init: RequestInit) => new Promise((_resolve, reject) => {
    init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  const pending = readRequestSnapshot("A", "motorist");
  const error = expect(pending).rejects.toThrow("Aborted");
  await vi.advanceTimersByTimeAsync(15_000); await error;
  expect(vi.getTimerCount()).toBe(0);
});
