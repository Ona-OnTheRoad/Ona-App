// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRecord } from "@/lib/jobs/types";
import type { AccountType } from "@/lib/types";
import { useJobFlowState } from "../use-job-flow-state";
import { useJobBootstrap } from "../use-job-bootstrap";
import { useJobLoad } from "../use-job-load";
import { isJobNewer } from "../../job-flow/job-utils";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/jobs/client", () => ({ apiGetJob: mocks.get, apiCreateJob: vi.fn() }));
vi.mock("@/lib/supabase/session", () => ({ ensureAppSession: vi.fn(async () => null) }));
const job = (version = 1, id = "job", status: JobRecord["status"] = "agreed") => ({
  id, status, jobVersion: version, updatedAt: "2026-10-20T10:00:00Z",
} as JobRecord);
function deferred<T>() {
  let resolve!: (value: T) => void; let reject!: (error: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
type Result = { ok: true; data: { job: JobRecord } } | { ok: false; message: string };
const ok = (j: JobRecord): Result => ({ ok: true, data: { job: j } });
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
function draw() {
  const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
  const hook = renderHook(({ id, user, role, auth }) => {
    const s = useJobFlowState(id);
    const { commitJob } = useJobBootstrap({ jobId: id, backendUserId: user, accountType: role,
      authReady: true, isAuthenticated: auth, s });
    const { load } = useJobLoad({ jobId: id, backendUserId: user, accountType: role,
      isAuthenticated: auth, router: router as never, notifRef: { current: null }, commitJob, s });
    return { s, load, commitJob };
  }, { initialProps: { id: "job", user: "A", role: "motorist" as AccountType, auth: true } });
  return { ...hook, router };
}
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });
afterEach(cleanup);

describe("detail snapshot integration", () => {
  it("shares physical reads across mounted same-user job consumers", async () => {
    const pending = deferred<Result>(); mocks.get.mockReturnValue(pending.promise);
    const a = draw(); const b = draw();
    let ap!: Promise<void>; let bp!: Promise<void>;
    act(() => { ap = a.result.current.load(); bp = b.result.current.load(); }); await flush();
    expect(mocks.get).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve(ok(job())); await Promise.all([ap, bp]); });
    expect(a.result.current.s.job?.jobVersion).toBe(1); expect(b.result.current.s.job?.jobVersion).toBe(1);
  });

  it("retains a visibility invalidation during a read and applies its newer revision", async () => {
    const first = deferred<Result>(); const second = deferred<Result>();
    mocks.get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const h = draw(); let initial!: Promise<void>; let follow!: Promise<void>;
    act(() => { initial = h.result.current.load(); }); await flush();
    act(() => { follow = h.result.current.load("visibility"); });
    await act(async () => { first.resolve(ok(job(1))); await initial; });
    expect(mocks.get).toHaveBeenCalledTimes(2);
    await act(async () => { second.resolve(ok(job(2))); await follow; });
    expect(h.result.current.s.job?.jobVersion).toBe(2);
  });

  it.each(["older", "equal"])("keeps intervening mutation state when a %s revision returns", async (revision) => {
    const pending = deferred<Result>(); mocks.get.mockReturnValue(pending.promise);
    const h = draw(); act(() => h.result.current.commitJob(job(8), true));
    let loading!: Promise<void>; act(() => { loading = h.result.current.load(); }); await flush();
    const mutation = job(revision === "older" ? 9 : 8, "job", "en_route");
    act(() => h.result.current.commitJob(mutation, true));
    await act(async () => { pending.resolve(ok(job(8))); await loading; });
    expect(h.result.current.s.job).toBe(mutation);
    // Force must not let an old server mutation reply bypass row ordering.
    act(() => h.result.current.commitJob(job(7), true));
    expect(h.result.current.s.job).toBe(mutation);
  });

  it("does not undo an optimistic status with an equal-revision background read", async () => {
    mocks.get.mockResolvedValue(ok(job(8, "job", "completed")));
    const h = draw(); const optimistic = job(8, "job", "satisfied");
    act(() => h.result.current.commitJob(optimistic, true));
    await act(async () => { await h.result.current.load(); });
    expect(h.result.current.s.job).toBe(optimistic);
    // The action's explicit server reconciliation can roll back a failed
    // optimistic change without weakening background snapshot guards.
    act(() => h.result.current.commitJob(job(8, "job", "completed"), true));
    expect(h.result.current.s.job?.status).toBe("completed");
  });

  it.each(["not-found", "forbidden", "throw", "success"])("ignores an old %s result after A to B to A", async (kind) => {
    const old = deferred<Result>(); mocks.get.mockReturnValueOnce(old.promise).mockResolvedValue(ok(job(3)));
    const h = draw(); const oldCommit = h.result.current.commitJob;
    let loading!: Promise<void>; act(() => { loading = h.result.current.load(); }); await flush();
    h.rerender({ id: "job", user: "B", role: "motorist", auth: true });
    h.rerender({ id: "job", user: "A", role: "motorist", auth: true });
    await act(async () => { await h.result.current.load(); });
    await act(async () => {
      if (kind === "throw") old.reject(new Error("old error"));
      else old.resolve(kind === "success" ? ok(job(99)) : { ok: false,
        message: kind === "not-found" ? "Job not found" : "Forbidden" });
      await loading;
      oldCommit(job(99), true);
    });
    expect(h.result.current.s.job?.jobVersion).toBe(3);
    expect(h.result.current.s.err).toBeNull(); expect(h.router.replace).not.toHaveBeenCalled();
  });

  it.each(["role", "sign-out"])("ignores old detail results after %s", async (change) => {
    const pending = deferred<Result>(); mocks.get.mockReturnValue(pending.promise);
    const h = draw(); act(() => h.result.current.commitJob(job(), true));
    let loading!: Promise<void>; act(() => { loading = h.result.current.load(); }); await flush();
    h.rerender({ id: "job", user: "A", role: change === "role" ? "professional" : "motorist",
      auth: change !== "sign-out" });
    await act(async () => { pending.resolve(ok(job(99))); await loading; });
    expect(h.result.current.s.job).toBeNull(); expect(h.result.current.s.err).toBeNull();
  });

  it("does not surface a stale timeout after a mutation committed", async () => {
    const pending = deferred<Result>(); mocks.get.mockReturnValue(pending.promise);
    const h = draw(); act(() => h.result.current.commitJob(job(1), true));
    let loading!: Promise<void>; act(() => { loading = h.result.current.load(); }); await flush();
    act(() => h.result.current.commitJob(job(2), true));
    await act(async () => { pending.reject(new Error("old timeout")); await loading; });
    expect(h.result.current.s.job?.jobVersion).toBe(2); expect(h.result.current.s.err).toBeNull();
  });

  it("clears old job state on navigation and ignores its late response", async () => {
    const old = deferred<Result>(); mocks.get.mockReturnValue(old.promise);
    const h = draw(); act(() => h.result.current.commitJob(job(), true));
    let loading!: Promise<void>; act(() => { loading = h.result.current.load(); }); await flush();
    h.rerender({ id: "other", user: "A", role: "motorist", auth: true });
    expect(h.result.current.s.job).toBeNull();
    await act(async () => { old.resolve(ok(job(99))); await loading; });
    expect(h.result.current.s.job).toBeNull();
  });

  it("preserves an instant seed for the destination when navigating between jobs", () => {
    const h = draw(); act(() => h.result.current.commitJob(job(), true));
    sessionStorage.setItem("ona-seed-job:other", JSON.stringify(job(2, "other")));
    h.rerender({ id: "other", user: "A", role: "motorist", auth: true });
    expect(h.result.current.s.job?.id).toBe("other");
    expect(h.result.current.s.jobRef.current?.id).toBe("other");
  });

  it("ignores errors after unmount", async () => {
    const pending = deferred<Result>(); mocks.get.mockReturnValue(pending.promise);
    const h = draw(); let loading!: Promise<void>;
    act(() => { loading = h.result.current.load(); }); await flush(); h.unmount();
    await act(async () => { pending.resolve({ ok: false, message: "Forbidden" }); await loading; });
    expect(h.router.replace).not.toHaveBeenCalled();
  });

  it("preserves hydrated call-out quote and contact fields across unhydrated mutation commits and equal-version reads", async () => {
    const pending = deferred<Result>(); mocks.get.mockReturnValue(pending.promise);
    const h = draw();
    const initialHydrated = {
      ...job(5, "job", "negotiating"),
      serviceType: "mechanic" as const,
      motoristId: "m1",
      motoristName: "Ada",
      motoristPhone: "+2348011111111",
      motoristVehicle: "Honda Accord 2020",
      repairProId: "p1",
      repairProName: "Kunle",
      repairProPhone: "+2348022222222",
      calloutQuote: {
        requestId: "job",
        calloutStatus: "CALCULATED" as const,
        tradeId: "mechanic" as const,
        originProId: "p1",
        calloutFee: 4500,
      },
    } as unknown as JobRecord;
    act(() => h.result.current.commitJob(initialHydrated, true));

    // Unhydrated mutation response at version 6 must keep hydrated contacts and settled quote
    const unhydratedMutation = {
      ...job(6, "job", "agreed"),
      serviceType: "mechanic" as const,
      motoristId: "m1",
      motoristName: "Customer",
      motoristPhone: null,
      motoristVehicle: null,
      repairProId: "p1",
      repairProName: "Repair Pro",
      repairProPhone: null,
      calloutQuote: null,
    } as unknown as JobRecord;
    act(() => h.result.current.commitJob(unhydratedMutation, true));
    expect(h.result.current.s.job?.status).toBe("agreed");
    expect(h.result.current.s.job?.jobVersion).toBe(6);
    expect(h.result.current.s.job?.motoristPhone).toBe("+2348011111111");
    expect(h.result.current.s.job?.motoristVehicle).toBe("Honda Accord 2020");
    expect(h.result.current.s.job?.repairProPhone).toBe("+2348022222222");
    expect(h.result.current.s.job?.calloutQuote?.calloutFee).toBe(4500);

    // Start a read at version 6, then apply an optimistic status at version 6
    let loading!: Promise<void>;
    act(() => { loading = h.result.current.load(); }); await flush();
    act(() => h.result.current.commitJob({ ...h.result.current.s.job!, status: "paid_booked" }, true));

    // Read returns version 6 with a newly LOCKED quote: status stays paid_booked, quote upgrades to LOCKED
    await act(async () => {
      pending.resolve(ok({
        ...unhydratedMutation,
        status: "agreed",
        calloutQuote: {
          requestId: "job",
          calloutStatus: "LOCKED" as const,
          tradeId: "mechanic" as const,
          originProId: "p1",
          calloutFee: 4500,
          lockedAt: "2026-10-20T10:05:00Z",
        } as never,
      }));
      await loading;
    });
    expect(h.result.current.s.job?.status).toBe("paid_booked");
    expect(h.result.current.s.job?.calloutQuote?.calloutStatus).toBe("LOCKED");
  });
});

it("uses durable revision before timestamps/status ordering", () => {
  const current = job(5, "job", "en_route");
  expect(isJobNewer({ ...job(4, "job", "released"), updatedAt: "2099-01-01" }, current)).toBe(false);
  expect(isJobNewer({ ...job(6), updatedAt: "2000-01-01" }, current)).toBe(true);
  expect(isJobNewer(job(5), current)).toBe(false);
  expect(isJobNewer({ ...current, repairProName: "Refreshed" }, current)).toBe(true);
  expect(isJobNewer({ ...job(), jobVersion: undefined }, current)).toBe(false);
});
