import { beforeEach, describe, expect, it, vi } from "vitest";

const lt = vi.fn();
const del = vi.fn(() => ({ lt }));
const from = vi.fn(() => ({ delete: del }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => ({ from }) }));

import {
  IDEMPOTENT_OPS_RETENTION_DAYS,
  pruneIdempotentOps,
} from "@/lib/server/idempotency-prune";
import { IDEM_KEY_TTL_MS } from "@/lib/jobs/idempotency";

const now = new Date("2026-11-21T12:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  lt.mockResolvedValue({ error: null, count: 42 });
});

describe("pruneIdempotentOps", () => {
  it("deletes ledger rows created more than 7 days ago, any status", async () => {
    const res = await pruneIdempotentOps({ now });

    expect(from).toHaveBeenCalledWith("idempotent_ops");
    expect(del).toHaveBeenCalledWith({ count: "exact" });
    // Only a created_at cutoff: no status filter, so abandoned "running" rows go too.
    expect(lt).toHaveBeenCalledTimes(1);
    expect(lt).toHaveBeenCalledWith("created_at", "2026-11-14T12:00:00.000Z");
    expect(res).toEqual({ ok: true, deleted: 42, cutoff: "2026-11-14T12:00:00.000Z" });
  });

  it("honours a custom retention", async () => {
    await pruneIdempotentOps({ now, olderThanDays: 30 });
    expect(lt).toHaveBeenCalledWith("created_at", "2026-10-22T12:00:00.000Z");
  });

  it("reports zero when the delete returns no count", async () => {
    lt.mockResolvedValue({ error: null, count: null });
    expect(await pruneIdempotentOps({ now })).toMatchObject({ ok: true, deleted: 0 });
  });

  it("returns the database error instead of throwing", async () => {
    lt.mockResolvedValue({ error: { message: "boom" }, count: null });
    expect(await pruneIdempotentOps({ now })).toEqual({ ok: false, error: "boom" });
  });

  it("keeps rows well past the client's op-key lifetime", () => {
    const retentionMs = IDEMPOTENT_OPS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    // At least double, so a skewed clock or a missed daily run cannot cut into it.
    expect(retentionMs).toBeGreaterThanOrEqual(2 * IDEM_KEY_TTL_MS);
  });
});
