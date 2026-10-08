import { beforeEach, describe, expect, it, vi } from "vitest";
import { runIdempotent } from "../idempotency";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
beforeEach(() => vi.clearAllMocks());
describe("new-operation preflight", () => {
  it("does not limit an already-completed OTP replay", async () => {
    const maybeSingle = vi.fn(async () => ({ data: { status: "done", result: { sent: true } } }));
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    vi.mocked(createServiceSupabase).mockReturnValue({ from: () => query } as unknown as ReturnType<typeof createServiceSupabase>);
    const beforeRun = vi.fn(async () => { throw new Error("Redis unavailable"); });
    const run = vi.fn(async () => ({ ok: true as const, result: { sent: true } }));
    expect(await runIdempotent({ opKey: "done", opType: "otp.send", beforeRun, run }))
      .toEqual({ status: "ok", replay: true, result: { sent: true } });
    expect(beforeRun).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });
  it("propagates transient errors before claiming or storing an operation", async () => {
    const insert = vi.fn();
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: null })), insert };
    vi.mocked(createServiceSupabase).mockReturnValue({ from: () => query } as unknown as ReturnType<typeof createServiceSupabase>);
    const run = vi.fn(async () => ({ ok: true as const, result: {} }));
    await expect(runIdempotent({ opKey: "new", opType: "otp.send", run,
      beforeRun: async () => { throw new Error("Redis unavailable"); } })).rejects.toThrow("Redis unavailable");
    expect(insert).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });
  it("also checks legacy callers before any side effect", async () => {
    vi.mocked(isSupabaseAdminConfigured).mockReturnValue(true);
    const run = vi.fn(async () => ({ ok: true as const, result: {} }));
    await expect(runIdempotent({ opType: "otp.send", run,
      beforeRun: async () => { throw new Error("Redis unavailable"); } })).rejects.toThrow();
    expect(run).not.toHaveBeenCalled();
  });
});
