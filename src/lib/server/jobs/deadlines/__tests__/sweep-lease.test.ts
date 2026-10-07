import { beforeEach, describe, expect, it, vi } from "vitest";
import { withSweepLease, SweepBusyError } from "../sweep-lease";
const rpc = vi.hoisted(() => vi.fn());
const configured = vi.hoisted(() => vi.fn(() => true));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => ({ rpc }) }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: configured }));
beforeEach(() => {
  configured.mockReturnValue(true);
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
});
describe("durable sweep lease", () => {
  it("releases only its own token after successful work", async () => {
    expect(await withSweepLease("pairing", async () => 42)).toBe(42);
    expect(rpc.mock.calls[0][0]).toBe("claim_job_sweep_lease");
    expect(rpc.mock.calls[1]).toEqual(["release_job_sweep_lease", rpc.mock.calls[0][1]]);
  });
  it("does not run or release another worker's lease", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const work = vi.fn();
    await expect(withSweepLease("pairing", work)).rejects.toBeInstanceOf(SweepBusyError);
    expect(work).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("fails closed when migration or database is unavailable", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "missing RPC" } });
    const work = vi.fn();
    await expect(withSweepLease("negotiation", work)).rejects.toThrow("claim");
    expect(work).not.toHaveBeenCalled();
    configured.mockReturnValue(false);
    await expect(withSweepLease("pairing", work)).rejects.toThrow("not configured");
  });
  it("releases on failure without masking the operation error", async () => {
    await expect(withSweepLease("pairing", async () => { throw new Error("failed work"); })).rejects.toThrow("failed work");
    expect(rpc.mock.calls[1][0]).toBe("release_job_sweep_lease");
  });
});
