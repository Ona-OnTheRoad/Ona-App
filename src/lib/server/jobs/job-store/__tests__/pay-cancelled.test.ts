import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ job: null as Record<string, unknown> | null, persist: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("../reads", () => ({ getJob: async () => m.job }));
vi.mock("../cache", () => ({ persist: m.persist, cacheJob: vi.fn() }));

import { startJobEscrowPayment } from "../payments";
import { PAY_HISTORY } from "@/lib/jobs/constants";

const at = "2026-06-01T10:00:00.000Z";
const job = (status: string, history: Array<{ status: string; by: string }>) => ({
  id: "job-1", motoristId: "cust-1", repairProId: "pro-1", status, agreedMajor: 5000, currency: "NGN",
  escrowStatus: null, statusHistory: history.map((h) => ({ ...h, at })), offers: [],
});
const pay = () => startJobEscrowPayment({ jobId: "job-1", motoristId: "cust-1", email: "c@x.test" } as never);

beforeEach(() => {
  m.persist.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("paying for a job that was cancelled", () => {
  it("is refused when the Repair Pro cancelled it, and the job is NOT revived", async () => {
    m.job = job("cancelled", [{ status: "agreed", by: "system" }, { status: "cancelled", by: "repair_pro" }]);
    const res = await pay();
    expect("error" in res && res.error).toMatch(/cancelled.*no longer be paid/i);
    expect(m.persist).not.toHaveBeenCalled();
  });

  it("is refused when the customer cancelled it", async () => {
    m.job = job("cancelled", [{ status: "cancelled", by: "motorist" }]);
    const res = await pay();
    expect("error" in res).toBe(true);
    expect(m.persist).not.toHaveBeenCalled();
  });

  it("is refused after the maximum payment attempts", async () => {
    m.job = job("cancelled", [{ status: "cancelled", by: PAY_HISTORY.MAX_ATTEMPTS_CANCEL }]);
    expect("error" in (await pay())).toBe(true);
    expect(m.persist).not.toHaveBeenCalled();
  });
});
