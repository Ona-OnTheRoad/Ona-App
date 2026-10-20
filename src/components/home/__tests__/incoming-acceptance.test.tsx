// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { JobRecord } from "@/lib/jobs/types";

const client = vi.hoisted(() => ({ apiTransition: vi.fn(), apiGetJob: vi.fn(), apiSurfaceJob: vi.fn(), apiDeferJob: vi.fn(), getCurrentPosition: vi.fn() }));
vi.mock("@/lib/jobs/client", () => client);
vi.mock("@/lib/supabase/session", () => ({ ensureAppSession: vi.fn(async () => {}) }));
vi.mock("@/lib/app-notify", () => ({ vibrateCallPattern: vi.fn() }));
vi.mock("@/lib/sound-tone", () => ({ playAppSound: vi.fn(), unlockAudio: vi.fn() }));
vi.mock("@/lib/push/client", () => ({ enablePushNotifications: vi.fn() }));
vi.mock("../incoming-job-popup/os-notification", () => ({ showOsNotificationOnce: vi.fn() }));
import { useIncomingState } from "../incoming-job-popup/use-incoming-state";
import { useIncomingQueue } from "../incoming-job-popup/use-incoming-queue";
import { useFixIt } from "../incoming-job-popup/use-fix-it";

const router = { bfcacheId: "acceptance-test", push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() };
const card = {
  id: "job", motoristId: "customer", motoristName: "Customer", repairProId: "pro", serviceType: "mechanic",
  status: "waiting_for_pro", pairingStage: "waiting_for_pro", pairingDeadline: new Date(Date.now() + 144_000).toISOString(),
  photos: [{ id: "photo", kind: "photo", url: "/test.png", createdAt: new Date().toISOString(), uploadedBy: "customer" }],
  offers: [], maxOffers: 6, currency: "NGN", statusHistory: [],
} as unknown as JobRecord;
const reserved = { ...card, status: "reserved", pairingStage: "reserved" } as JobRecord;
const negotiating = { ...card, status: "negotiating", pairingStage: null, negotiateEndsAt: new Date(Date.now() + 1_200_000).toISOString(), assignmentStatus: "assigned" } as JobRecord;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function setup() {
  return renderHook(() => {
    const state = useIncomingState({ backendUserId: "pro", isAuthenticated: true, authReady: true, router });
    const queue = useIncomingQueue({ backendUserId: "pro", router, state });
    const fix = useFixIt({ backendUserId: "pro", router, state, removeRef: queue.removeRef });
    return { state, queue, fix };
  });
}
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear();
  client.apiTransition.mockReset();
  client.apiSurfaceJob.mockResolvedValue({ ok: true });
  client.getCurrentPosition.mockResolvedValue({ coords: { latitude: 6.5, longitude: 3.3, accuracy: 10 } });
});
afterEach(cleanup);

it("waits for automatic Open and Confirm before hiding the card or navigating", async () => {
  const opened = deferred<{ ok: true; data: { job: JobRecord } }>();
  const confirmed = deferred<{ ok: true; data: { job: JobRecord } }>();
  client.apiTransition.mockImplementation(({ event }) => event === "OPEN" ? opened.promise : confirmed.promise);
  const { result } = setup();
  await act(() => result.current.queue.presentJob(card));
  let acceptance!: Promise<void>;
  act(() => { acceptance = result.current.fix(card); });
  expect(client.apiTransition.mock.calls.map(([b]) => b.event)).toEqual(["OPEN"]);
  expect(router.push).not.toHaveBeenCalled();
  expect(result.current.state.visibleJobs).toHaveLength(1);
  await act(async () => { opened.resolve({ ok: true, data: { job: reserved } }); await Promise.resolve(); });
  expect(client.apiTransition.mock.calls.map(([b]) => b.event)).toEqual(["OPEN", "CONFIRM"]);
  expect(router.push).not.toHaveBeenCalled();
  await act(async () => { confirmed.resolve({ ok: true, data: { job: negotiating } }); await acceptance; });
  expect(router.push).toHaveBeenCalledWith("/jobs/job");
  expect(result.current.state.visibleJobs).toHaveLength(0);
  expect(JSON.parse(sessionStorage.getItem("ona-seed-job:job")!).status).toBe("negotiating");
});

it("retries a resolved automatic Open failure instead of treating attempted as completed", async () => {
  client.apiTransition.mockResolvedValueOnce({ ok: false, message: "Temporary failure" })
    .mockResolvedValueOnce({ ok: true, data: { job: reserved } })
    .mockResolvedValueOnce({ ok: true, data: { job: negotiating } });
  const { result } = setup();
  await act(() => result.current.queue.presentJob(card));
  await act(() => result.current.fix(card));
  expect(client.apiTransition.mock.calls.map(([b]) => b.event)).toEqual(["OPEN", "OPEN", "CONFIRM"]);
  expect(router.push).toHaveBeenCalledTimes(1);
});

it("keeps the card and confirmation error visible so the pro can retry", async () => {
  client.apiTransition.mockResolvedValueOnce({ ok: true, data: { job: reserved } })
    .mockResolvedValueOnce({ ok: false, message: "Could not confirm. Retry." });
  const { result } = setup();
  await act(() => result.current.queue.presentJob(card));
  await act(() => result.current.fix(reserved));
  expect(router.push).not.toHaveBeenCalled();
  expect(result.current.state.visibleJobs).toHaveLength(1);
  expect(result.current.state.actionError).toBe("Could not confirm. Retry.");
  expect(result.current.state.acceptingId).toBeNull();
});

it("does not navigate on a successful HTTP response that still contains an unconfirmed job", async () => {
  client.apiTransition.mockResolvedValue({ ok: true, data: { job: reserved } });
  const { result } = setup();
  await act(() => result.current.queue.presentJob(reserved));
  await act(() => result.current.fix(reserved));
  expect(router.push).not.toHaveBeenCalled();
  expect(result.current.state.visibleJobs).toHaveLength(1);
  expect(result.current.state.actionError).toMatch(/confirm|pending/i);
});

it("coalesces repeated acceptance taps while confirmation is in flight", async () => {
  const confirmed = deferred<{ ok: true; data: { job: JobRecord } }>();
  client.apiTransition.mockReturnValue(confirmed.promise);
  const { result } = setup();
  let one!: Promise<void>, two!: Promise<void>;
  act(() => { one = result.current.fix(reserved); two = result.current.fix(reserved); });
  await act(async () => { confirmed.resolve({ ok: true, data: { job: negotiating } }); await Promise.all([one, two]); });
  expect(client.apiTransition).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledTimes(1);
});

it("retries an automatic Open network rejection on acceptance", async () => {
  client.apiTransition.mockRejectedValueOnce(new Error("Network interrupted"))
    .mockResolvedValueOnce({ ok: true, data: { job: reserved } })
    .mockResolvedValueOnce({ ok: true, data: { job: negotiating } });
  const { result } = setup();
  await act(() => result.current.queue.presentJob(card));
  await act(() => result.current.fix(card));
  expect(client.apiTransition.mock.calls.map(([b]) => b.event)).toEqual(["OPEN", "OPEN", "CONFIRM"]);
  expect(router.push).toHaveBeenCalledTimes(1);
});
