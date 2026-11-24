import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/push/webpush", () => ({
  sendPushToUser: vi.fn(async () => ({ sent: 0, failures: [] })),
}));

const db = vi.hoisted(() => ({
  job: null as { motorist_id: string; repair_pro_id: string } | null,
  inserted: null as Record<string, unknown> | null,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === "service_requests"
            ? { maybeSingle: async () => ({ data: db.job }) }
            : { eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) },
      }),
      insert: (row: Record<string, unknown>) => {
        db.inserted = row;
        return { select: () => ({ single: async () => ({ data: { id: "n1" }, error: null }) }) };
      },
    }),
  }),
}));

import { insertNotification } from "../notifications";

const base = { category: "payments" as const, title: "t", body: "b" };

beforeEach(() => {
  db.job = { motorist_id: "user-1", repair_pro_id: "user-2" };
  db.inserted = null;
});

describe("insertNotification audience", () => {
  it("derives the recipient's side from the job", async () => {
    await insertNotification({ ...base, userId: "user-1", jobId: "j1" });
    expect(db.inserted?.audience).toBe("motorist");
    await insertNotification({ ...base, userId: "user-2", jobId: "j1" });
    expect(db.inserted?.audience).toBe("professional");
  });
  it("leaves audience null with no job (shows in both modes)", async () => {
    await insertNotification({ ...base, userId: "user-1" });
    expect(db.inserted?.audience).toBeNull();
  });
  it("leaves audience null when the user is not a party to the job", async () => {
    await insertNotification({ ...base, userId: "other", jobId: "j1" });
    expect(db.inserted?.audience).toBeNull();
  });
  it("an explicit audience wins over the job lookup", async () => {
    await insertNotification({
      ...base,
      userId: "user-1",
      jobId: "j1",
      audience: "professional",
    });
    expect(db.inserted?.audience).toBe("professional");
  });
});
