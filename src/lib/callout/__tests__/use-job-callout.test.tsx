// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetCalloutQuoteCache, useJobCallout } from "../use-job-callout";
import type { CalloutQuote } from "../constants";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/jobs/client", () => ({ apiGetCallout: mocks.get }));
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const quote = (calloutStatus: CalloutQuote["calloutStatus"] = "LOCKED", calloutFee = 3000) =>
  ({ calloutStatus, calloutFee } as CalloutQuote);
const ok = (q: CalloutQuote | null) => ({ ok: true, data: { quote: q } });
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
function deferred() {
  let resolve!: (v: ReturnType<typeof ok>) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<ReturnType<typeof ok>>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); resetCalloutQuoteCache(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("call-out job identity and polling", () => {
  it.each([undefined, null, "", "new", "pending-dccswh6f", "not-a-uuid", "11111111-1111-4111-8111-11111111111Z"])(
    "does not request or poll a non-persisted job ID: %s", async (id) => {
      const h = renderHook(() => useJobCallout(id, "sequential_pairing"));
      await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
      expect(mocks.get).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
      expect(h.result.current).toEqual({ quote: null, ready: false });
    },
  );

  it("starts loading when a temporary ID is replaced by a persisted ID", async () => {
    const q = quote(); mocks.get.mockResolvedValue(ok(q));
    const h = renderHook(({ id }) => useJobCallout(id, "sequential_pairing"),
      { initialProps: { id: "pending-dccswh6f" } });
    await flush(); expect(mocks.get).not.toHaveBeenCalled();
    h.rerender({ id: A }); await flush();
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith(A, { source: "callout", trigger: "initial" });
    expect(h.result.current).toEqual({ quote: q, ready: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains the three-second unresolved retry and stops on a final quote", async () => {
    mocks.get.mockResolvedValueOnce(ok(null)).mockResolvedValueOnce(ok(quote("PENDING")))
      .mockResolvedValue(ok(quote()));
    const h = renderHook(() => useJobCallout(A)); await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(2999); });
    expect(mocks.get).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(mocks.get).toHaveBeenCalledTimes(2); expect(h.result.current.ready).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(mocks.get).toHaveBeenCalledTimes(3); expect(h.result.current.ready).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps an available quote through a failed same-job refresh", async () => {
    const q = quote(); mocks.get.mockResolvedValueOnce(ok(q)).mockRejectedValue(new Error("offline"));
    const h = renderHook(({ status }) => useJobCallout(A, status), { initialProps: { status: "agreed" } });
    await flush(); h.rerender({ status: "paid_booked" }); await flush();
    expect(h.result.current).toEqual({ quote: q, ready: true });
    expect(vi.getTimerCount()).toBe(1); h.unmount(); expect(vi.getTimerCount()).toBe(0);
  });

  it("does not show the previous job's fetched quote while another job loads", async () => {
    const pending = deferred(); const aq = quote(); const bq = quote("LOCKED", 4500);
    mocks.get.mockResolvedValueOnce(ok(aq)).mockReturnValueOnce(pending.promise);
    const h = renderHook(({ id }) => useJobCallout(id), { initialProps: { id: A } });
    await flush(); expect(h.result.current.quote).toBe(aq);
    h.rerender({ id: "pending-other" }); expect(h.result.current.quote).toBeNull();
    h.rerender({ id: B }); expect(h.result.current.quote).toBeNull();
    await act(async () => { pending.resolve(ok(bq)); });
    expect(h.result.current.quote).toBe(bq);
  });

  it("ignores a late old-job completion after switching to a temporary ID", async () => {
    const pending = deferred(); mocks.get.mockReturnValue(pending.promise);
    const h = renderHook(({ id }) => useJobCallout(id), { initialProps: { id: A } });
    h.rerender({ id: "pending-other" });
    await act(async () => { pending.resolve(ok(quote())); });
    expect(h.result.current.quote).toBeNull(); expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["unmount", "navigate"])("does not rearm retries when a retired request rejects after %s", async (change) => {
    const pending = deferred(); mocks.get.mockReturnValueOnce(pending.promise).mockResolvedValue(ok(quote()));
    const h = renderHook(({ id }) => useJobCallout(id), { initialProps: { id: A } });
    if (change === "unmount") h.unmount(); else { h.rerender({ id: B }); await flush(); }
    await act(async () => { pending.reject(new Error("late timeout")); });
    const count = mocks.get.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
    expect(mocks.get).toHaveBeenCalledTimes(count); expect(vi.getTimerCount()).toBe(0);
  });
});
