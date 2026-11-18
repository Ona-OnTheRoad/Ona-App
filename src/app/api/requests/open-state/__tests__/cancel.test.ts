import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(async () => ({ ok: true, userId: "cust-1" })),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));

import { createServiceSupabase } from "@/lib/supabase/server";
import { GET, POST } from "../route";

type Row = Record<string, unknown>;

/** Tiny in-memory service_requests / ona_express_payments store. */
function makeDb(requests: Row[], opts: { failCancel?: boolean } = {}) {
  const payments: Row[] = [{ request_id: "req-0001", user_id: "cust-1", status: "pending" }];
  const table = (name: string) => {
    const rows = name === "service_requests" ? requests : payments;
    const filters: Array<(r: Row) => boolean> = [];
    let patch: Row | null = null;
    let selectCols = false;
    const q: Record<string, unknown> = {
      update: (p: Row) => { patch = p; return q; },
      select: () => { selectCols = true; return q; },
      eq: (k: string, v: unknown) => { filters.push((r) => r[k] === v); return q; },
      order: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: rows.filter((r) => filters.every((f) => f(r)))[0] ?? null, error: null }),
      then: (resolve: (v: unknown) => void) => {
        const hit = rows.filter((r) => filters.every((f) => f(r)));
        if (patch) {
          if (opts.failCancel && name === "service_requests") return resolve({ data: [], error: null });
          hit.forEach((r) => Object.assign(r, patch));
        }
        resolve({ data: selectCols || !patch ? hit : null, error: null });
      },
    };
    return q;
  };
  return { from: table } as unknown as ReturnType<typeof createServiceSupabase>;
}

const post = (body: unknown) =>
  POST(new Request("http://x/api/requests/open-state", { method: "POST", body: JSON.stringify(body) }));
const draft = (): Row => ({
  id: "req-0001", motorist_id: "cust-1", source: "express", status: "draft",
  service_type: "mechanic", pickup_lat: 6.5, pickup_lng: 3.3, pickup_address: "Yaba",
});

describe("cancelling an Express request", () => {
  beforeEach(() => vi.mocked(createServiceSupabase).mockReset());

  it("cancels the draft so no Resume card is offered afterwards", async () => {
    const requests = [draft()];
    vi.mocked(createServiceSupabase).mockReturnValue(makeDb(requests));

    const before = await (await GET(new Request("http://x"))).json();
    expect(before.data.expressPending?.requestId).toBe("req-0001");

    const res = await post({ requestId: "req-0001", mode: "both" });
    expect(res.status).toBe(200);
    expect(requests[0].status).toBe("cancelled");

    const after = await (await GET(new Request("http://x"))).json();
    expect(after.data.expressPending).toBeNull();
    expect(after.data.hasOpen).toBe(false);
  });

  it("defaults to cancelling the request, not just the payment", async () => {
    const requests = [draft()];
    vi.mocked(createServiceSupabase).mockReturnValue(makeDb(requests));
    const res = await post({ requestId: "req-0001" });
    expect(res.status).toBe(200);
    expect(requests[0].status).toBe("cancelled");
  });

  it("fails loudly (so the screen stays) when the draft could not be cancelled", async () => {
    const requests = [draft()];
    vi.mocked(createServiceSupabase).mockReturnValue(makeDb(requests, { failCancel: true }));
    const res = await post({ requestId: "req-0001", mode: "both" });
    expect(res.status).toBe(500);
    expect(requests[0].status).toBe("draft");
  });

  it("is idempotent when the request is already cancelled", async () => {
    const requests = [{ ...draft(), status: "cancelled" }];
    vi.mocked(createServiceSupabase).mockReturnValue(makeDb(requests));
    const res = await post({ requestId: "req-0001", mode: "both" });
    expect(res.status).toBe(200);
  });
});
