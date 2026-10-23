import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/push/env", () => ({
  isVapidConfigured: vi.fn(() => true),
  getVapidSubject: vi.fn(() => "mailto:admin@example.com"),
  getVapidPublicKey: vi.fn(() => "pub-key"),
  getVapidPrivateKey: vi.fn(() => "priv-key"),
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(async () => {}),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import { sendPushToUser } from "../webpush";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

describe("sendPushToUser preference gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips push when user master notifications are disabled", async () => {
    createServiceSupabaseMock.mockReturnValueOnce({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { notification_preferences: { enabled: false } },
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as never);

    const res = await sendPushToUser("user-1", {
      title: "New Job",
      body: "A job is available",
      priority: "normal",
    });

    expect(res.sent).toBe(0);
    expect(res.failures).toContain("push_disabled_master");
  });

  it("skips push when user push delivery is disabled", async () => {
    createServiceSupabaseMock.mockReturnValueOnce({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    notification_preferences: {
                      enabled: true,
                      delivery: { push: false },
                    },
                  },
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as never);

    const res = await sendPushToUser("user-1", {
      title: "New Job",
      body: "A job is available",
      priority: "normal",
    });

    expect(res.sent).toBe(0);
    expect(res.failures).toContain("push_disabled_by_user");
  });

  it("skips push when category is disabled", async () => {
    createServiceSupabaseMock.mockReturnValueOnce({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    notification_preferences: {
                      enabled: true,
                      categories: { promotional: false },
                    },
                  },
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as never);

    const res = await sendPushToUser("user-1", {
      title: "Discount",
      body: "Special weekend promo",
      category: "promotional",
      priority: "normal",
    });

    expect(res.sent).toBe(0);
    expect(res.failures).toContain("push_category_disabled");
  });

  it("allows critical priority push to break through even if master is disabled", async () => {
    createServiceSupabaseMock.mockReturnValueOnce({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { notification_preferences: { enabled: false } },
                })),
              })),
            })),
          };
        }
        if (table === "push_subscriptions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({
                data: [
                  {
                    endpoint: "https://push.example.com/sub/123456789012345678901234",
                    p256dh: "key",
                    auth: "auth",
                  },
                ],
                error: null,
              })),
            })),
          };
        }
        return {};
      }),
    } as never);

    const res = await sendPushToUser("user-1", {
      title: "Emergency Alert",
      body: "Vehicle safety notice",
      priority: "critical",
    });

    expect(res.sent).toBe(1);
    expect(res.failures).toHaveLength(0);
  });
});
