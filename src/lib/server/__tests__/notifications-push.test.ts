import { beforeEach, describe, expect, it, vi } from "vitest";

const sendPushToUser = vi.hoisted(() => vi.fn(async () => ({ sent: 1, failures: [] })));
vi.mock("@/lib/server/push/webpush", () => ({ sendPushToUser }));

const db = vi.hoisted(() => ({
  existing: null as { id: string } | null,
  insertError: null as { message: string } | null,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({ maybeSingle: async () => ({ data: db.existing }) }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () =>
            db.insertError
              ? { data: null, error: db.insertError }
              : { data: { id: "n1" }, error: null },
        }),
      }),
    }),
  }),
}));

import { insertNotification } from "../notifications";

const base = {
  userId: "pro-1",
  category: "requests" as const,
  title: "Service Request",
  body: "New request from Ada",
  href: "/jobs/j1",
  jobId: "j1",
  groupKey: "service-request-j1",
};

beforeEach(() => {
  sendPushToUser.mockClear();
  db.existing = null;
  db.insertError = null;
});

describe("insertNotification push fan-out", () => {
  it("pushes high priority notifications to the device", async () => {
    await insertNotification({ ...base, priority: "high" });
    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(sendPushToUser).toHaveBeenCalledWith(
      "pro-1",
      expect.objectContaining({
        title: "Service Request",
        url: "/jobs/j1",
        tag: "service-request-j1",
        category: "requests",
        urgency: "normal",
        requireInteraction: false,
      }),
    );
  });

  it("treats an urgent offer as time-critical: short TTL, high urgency, stays on screen", async () => {
    await insertNotification({ ...base, priority: "high", pushUrgent: true });
    expect(sendPushToUser).toHaveBeenCalledWith(
      "pro-1",
      expect.objectContaining({ ttl: 120, urgency: "high", requireInteraction: true }),
    );
  });

  it("keeps critical payment prompts deliverable for hours at high urgency", async () => {
    await insertNotification({
      ...base,
      category: "payments",
      priority: "critical",
      title: "Confirm Job & Release Payment",
    });
    expect(sendPushToUser).toHaveBeenCalledWith(
      "pro-1",
      expect.objectContaining({ ttl: 21600, urgency: "high", priority: "critical" }),
    );
  });

  it("does not push quiet (normal / low) notifications", async () => {
    await insertNotification({ ...base, priority: "normal", title: "Request moved on" });
    await insertNotification({ ...base, title: "No priority given" });
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("does not push when the caller sends its own push", async () => {
    await insertNotification({ ...base, priority: "high", push: false });
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("does not push a deduplicated repeat", async () => {
    db.existing = { id: "n0" };
    const res = await insertNotification({ ...base, priority: "high" });
    expect(res).toEqual({ id: "n0", skipped: true });
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("does not push when the row could not be saved", async () => {
    db.insertError = { message: "db down" };
    const res = await insertNotification({ ...base, priority: "high" });
    expect(res).toEqual({ error: "db down" });
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("never lets a failing push break the notification", async () => {
    sendPushToUser.mockRejectedValueOnce(new Error("push service down"));
    const res = await insertNotification({ ...base, priority: "high" });
    expect(res).toEqual({ id: "n1" });
  });
});
