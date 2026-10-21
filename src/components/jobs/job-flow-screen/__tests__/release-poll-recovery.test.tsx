// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useReleasePayGate } from "@/components/jobs/motorist-release-pay-gate/use-release-pay-gate";
const client = vi.hoisted(() => ({ apiListJobs: vi.fn(), apiExpireStaleBookedJobs: vi.fn(async () => {}) }));
vi.mock("@/lib/jobs/client", () => client);
vi.mock("next/navigation", () => ({ useRouter: () => ({}), usePathname: () => "/" }));
vi.mock("@/lib/store", () => ({ useApp: () => ({ backendUserId: "customer", isAuthenticated: true, theme: "light" }) }));
vi.mock("@/lib/callout/use-job-callout", () => ({ useJobCallout: () => ({ quote: null, ready: true }) }));
vi.mock("@/components/jobs/motorist-release-pay-gate/release-helpers", () => ({
  needsRelease: () => true, buzzForJob: vi.fn(),
}));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); localStorage.clear(); });

it("preserves a release prompt on timeout, skips overlapping polls, then reconciles", async () => {
  vi.useFakeTimers();
  const job = { id: "job", motoristId: "customer", status: "completed", agreedMajor: 5000 };
  let reject!: (reason: Error) => void;
  client.apiListJobs.mockResolvedValueOnce({ ok: true, data: { jobs: [job] } })
    .mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }))
    .mockResolvedValue({ ok: true, data: { jobs: [] } });
  const h = renderHook(useReleasePayGate);
  await act(async () => { await Promise.resolve(); });
  expect(h.result.current.pending?.id).toBe("job");
  await act(async () => { await vi.advanceTimersByTimeAsync(90_000); });
  expect(client.apiListJobs).toHaveBeenCalledTimes(2);
  await act(async () => { reject(new Error("Request timed out")); });
  expect(h.result.current.pending?.id).toBe("job");
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(client.apiListJobs).toHaveBeenCalledTimes(3);
  expect(h.result.current.pending).toBeNull();
});
