import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ eq: [] as Array<[string, unknown]>, error: null as { message: string } | null }));
vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(async () => ({ ok: true, userId: "u1" })),
}));
vi.mock("@/lib/push/env", () => ({ isVapidConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      expect(table).toBe("push_subscriptions");
      const chain = {
        delete: () => chain,
        eq: (col: string, val: unknown) => {
          calls.eq.push([col, val]);
          return calls.eq.length >= 2 ? Promise.resolve({ error: calls.error }) : chain;
        },
      };
      return chain;
    },
  }),
}));
import { requireUser } from "@/lib/server/auth-utils";
import { DELETE } from "../register/route";

const req = (body: unknown) =>
  new Request("https://ona.test/api/push/register", { method: "DELETE", body: JSON.stringify(body) });

beforeEach(() => {
  calls.eq = [];
  calls.error = null;
});

describe("DELETE /api/push/register", () => {
  it("removes only the caller's own subscription for that endpoint", async () => {
    const res = await DELETE(req({ endpoint: "https://push.example/e1" }));
    expect(res.status).toBe(200);
    expect(calls.eq).toEqual([["endpoint", "https://push.example/e1"], ["user_id", "u1"]]);
  });
  it("rejects a malformed body", async () => {
    expect((await DELETE(req({ endpoint: "nope" }))).status).toBe(400);
    expect(calls.eq).toEqual([]);
  });
  it("requires a signed-in user", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({ ok: false, response: new Response(null, { status: 401 }) } as never);
    expect((await DELETE(req({ endpoint: "https://push.example/e1" }))).status).toBe(401);
  });
});
