// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({ getJob: vi.fn() }));
vi.mock("@/lib/jobs/client", () => ({ apiGetJob: m.getJob }));

import { useCheckoutLiveStatus } from "../use-checkout-live-status";

const ok = (status: string) => ({ ok: true, data: { job: { id: "job-1", status } } });
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
};

beforeEach(() => {
  vi.useFakeTimers();
  m.getJob.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useCheckoutLiveStatus: stop asking for payment once the job is cancelled", () => {
  it("tells the checkout when the Repair Pro cancels while the customer is on the payment screen", async () => {
    const onCancelled = vi.fn();
    m.getJob.mockResolvedValue(ok("agreed"));
    renderHook(() => useCheckoutLiveStatus("summary", "job-1", onCancelled));
    await tick(4000);
    expect(onCancelled).not.toHaveBeenCalled();

    m.getJob.mockResolvedValue(ok("cancelled"));
    await tick(4000);
    expect(onCancelled).toHaveBeenCalledTimes(1);
    expect(onCancelled.mock.calls[0][0].status).toBe("cancelled");
  });

  it("also watches while the bank-transfer details are on screen", async () => {
    const onCancelled = vi.fn();
    m.getJob.mockResolvedValue(ok("cancelled"));
    renderHook(() => useCheckoutLiveStatus("bank_pay", "job-1", onCancelled));
    await tick(4000);
    expect(onCancelled).toHaveBeenCalledTimes(1);
  });

  it("reports only once and then stops polling", async () => {
    const onCancelled = vi.fn();
    m.getJob.mockResolvedValue(ok("cancelled"));
    renderHook(() => useCheckoutLiveStatus("summary", "job-1", onCancelled));
    await tick(4000);
    await tick(12000);
    expect(onCancelled).toHaveBeenCalledTimes(1);
    expect(m.getJob).toHaveBeenCalledTimes(1);
  });

  it("does not poll once the checkout is already in the cancelled or error state", async () => {
    renderHook(() => useCheckoutLiveStatus("cancelled", "job-1", vi.fn()));
    renderHook(() => useCheckoutLiveStatus("error", "job-1", vi.fn()));
    await tick(12000);
    expect(m.getJob).not.toHaveBeenCalled();
  });

  it("survives a failed status check and keeps watching", async () => {
    const onCancelled = vi.fn();
    m.getJob.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(ok("cancelled"));
    renderHook(() => useCheckoutLiveStatus("summary", "job-1", onCancelled));
    await tick(4000);
    expect(onCancelled).not.toHaveBeenCalled();
    await tick(4000);
    expect(onCancelled).toHaveBeenCalledTimes(1);
  });

  it("an ordinary status change (e.g. paid) is not treated as cancelled", async () => {
    const onCancelled = vi.fn();
    m.getJob.mockResolvedValue(ok("paid_booked"));
    renderHook(() => useCheckoutLiveStatus("summary", "job-1", onCancelled));
    await tick(8000);
    expect(onCancelled).not.toHaveBeenCalled();
  });
});
