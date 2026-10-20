// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCloudJobs, reconcileRequests } from "../use-cloud-jobs";
import type { SessionStateResult } from "../use-session-state";
import type { AccountType, ServiceRequest } from "@/lib/types";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/lib/supabase/app-api", () => ({ isAppBackendOnline: () => true }));
vi.mock("@/lib/supabase/request-snapshots", () => ({ readRequestSnapshot: mocks.read }));
const row = (version = 1, name = "Pro"): ServiceRequest => ({ id: "job", jobVersion: version,
  technicianName: name, technicianId: "pro", serviceType: "mechanic", problem: "help",
  status: "accepted", createdAt: "now", etaMinutes: 15, distanceKm: 0, locationLabel: "Here" });
function deferred<T>() {
  let resolve!: (value: T) => void; let reject!: (error: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
function draw() {
  return renderHook(({ user, role, auth }) => {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const refresh = useCloudJobs({ backendUserId: user, accountType: role, isAuthenticated: auth } as SessionStateResult,
      requests, setRequests);
    return { requests, refresh, setRequests };
  }, { initialProps: { user: "A", role: "motorist" as AccountType, auth: true } });
}
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe("cloud snapshot integration", () => {
  it("shares stacked reads and retains a realtime invalidation during fetch", async () => {
    const first = deferred<ServiceRequest[]>(); const second = deferred<ServiceRequest[]>();
    mocks.read.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const h = draw();
    act(() => { h.result.current.refresh("initial"); h.result.current.refresh("interval"); }); await flush();
    expect(mocks.read).toHaveBeenCalledTimes(1);
    act(() => { h.result.current.refresh("realtime"); h.result.current.refresh("realtime"); });
    await act(async () => { first.resolve([row()]); });
    expect(mocks.read).toHaveBeenCalledTimes(2);
    expect(h.result.current.requests[0].jobVersion).toBe(1);
    await act(async () => { second.resolve([row(2)]); });
    expect(h.result.current.requests[0].jobVersion).toBe(2);
  });

  it("keeps data on failure, recovers, and clears a successful empty list", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.read.mockResolvedValueOnce([row()]).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([]);
    const h = draw(); act(() => h.result.current.refresh()); await flush();
    act(() => h.result.current.refresh()); await flush();
    expect(h.result.current.requests).toEqual([row()]);
    act(() => h.result.current.refresh()); await flush();
    expect(h.result.current.requests).toEqual([]); warn.mockRestore();
  });

  it.each(["account", "role", "sign-out"])("rejects late results after %s changes, including A to B to A", async (change) => {
    const old = deferred<ServiceRequest[]>();
    mocks.read.mockReturnValueOnce(old.promise).mockResolvedValue([row(4, "current")]);
    const h = draw(); act(() => h.result.current.refresh()); await flush();
    h.rerender({ user: change === "account" ? "B" : "A",
      role: change === "role" ? "professional" : "motorist", auth: change !== "sign-out" });
    expect(h.result.current.requests).toEqual([]);
    h.rerender({ user: "A", role: "motorist", auth: true });
    act(() => h.result.current.refresh()); await flush();
    await act(async () => { old.resolve([row(99, "old")]); });
    expect(h.result.current.requests).toEqual([row(4, "current")]);
  });

  it("drops queued reconciliation on last unmount", async () => {
    const old = deferred<ServiceRequest[]>(); mocks.read.mockReturnValue(old.promise);
    const h = draw(); act(() => h.result.current.refresh()); await flush();
    act(() => h.result.current.refresh("realtime")); h.unmount();
    await act(async () => { old.resolve([row()]); });
    expect(mocks.read).toHaveBeenCalledTimes(1);
  });
});

describe("request projection reconciliation", () => {
  it("keeps newer rows and applies same-status visible field changes", () => {
    const previous = [row(3)];
    expect(reconcileRequests(previous, [row(2)], previous)).toBe(previous);
    expect(reconcileRequests(previous, [row(3, "Renamed")], previous)[0].technicianName).toBe("Renamed");
  });
  it("preserves local edits/additions made during fetch until the next reconciliation", () => {
    const started = [row()]; const updated = row(1, "local");
    expect(reconcileRequests([updated], [row()], started)).toEqual([updated]);
    expect(reconcileRequests([updated], [], started)).toEqual([updated]);
    expect(reconcileRequests([updated], [], [updated])).toEqual([]);
  });
});
