import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/push/env", () => ({
  isVapidConfigured: vi.fn(() => true),
  getVapidSubject: vi.fn(() => "mailto:admin@example.com"),
  getVapidPublicKey: vi.fn(() => "pub-key"),
  getVapidPrivateKey: vi.fn(() => "priv-key"),
}));

const sendNotificationMock = vi.fn(async () => {});

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

const enqueueNotificationDelivery = vi.fn(async () => ({ ok: true }));

vi.mock("@/lib/server/notifications-retry", () => ({
  enqueueNotificationDelivery: (...args: unknown[]) =>
    enqueueNotificationDelivery(...args),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import { isVapidConfigured } from "@/lib/push/env";
import {
  isNonRetryablePushFailure,
  sendPushToUser,
} from "../webpush";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);
const isVapidConfiguredMock = vi.mocked(isVapidConfigured);

function mockSb(opts: {
  prefs?: unknown;
  subscriptions?: Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }> | null;
}) {
  createServiceSupabaseMock.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: {
                  notification_preferences:
                    opts.prefs === undefined
                      ? { enabled: true }
                      : opts.prefs,
                },
              })),
            })),
          })),
        };
      }
      if (table === "push_subscriptions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({
              data: opts.subscriptions ?? [],
              error: null,
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }
      return {};
    }),
  } as never);
}

describe("isNonRetryablePushFailure", () => {
  it("treats preference and missing-subscription codes as permanent", () => {
    expect(isNonRetryablePushFailure(["push_disabled_master"])).toBe(true);
    expect(isNonRetryablePushFailure(["no_subscriptions"])).toBe(true);
    expect(isNonRetryablePushFailure(["404:abc", "410:def"])).toBe(true);
  });

  it("treats transient codes as retryable", () => {
    expect(isNonRetryablePushFailure(["500:endpoint-tail"])).toBe(false);
    expect(isNonRetryablePushFailure(["push_failed"])).toBe(false);
  });
});

describe("sendPushToUser preference gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isVapidConfiguredMock.mockReturnValue(true);
    sendNotificationMock.mockResolvedValue(undefined);
    enqueueNotificationDelivery.mockResolvedValue({ ok: true });
  });

  it("skips push when user master notifications are disabled", async () => {
    mockSb({ prefs: { enabled: false }, subscriptions: [] });

    const res = await sendPushToUser("user-1", {
      title: "New Job",
      body: "A job is available",
      priority: "normal",
    });

    expect(res.sent).toBe(0);
    expect(res.failures).toContain("push_disabled_master");
    expect(enqueueNotificationDelivery).not.toHaveBeenCalled();
  });

  it("skips push when user push delivery is disabled", async () => {
    mockSb({
      prefs: { enabled: true, delivery: { push: false } },
      subscriptions: [],
    });

    const res = await sendPushToUser("user-1", {
      title: "New Job",
      body: "A job is available",
      priority: "normal",
    });

    expect(res.sent).toBe(0);
    expect(res.failures).toContain("push_disabled_by_user");
    expect(enqueueNotificationDelivery).not.toHaveBeenCalled();
  });

  it("skips push when category is disabled", async () => {
    mockSb({
      prefs: { enabled: true, categories: { promotional: false } },
      subscriptions: [],
    });

    const res = await sendPushToUser("user-1", {
      title: "Discount",
      body: "Special weekend promo",
      category: "promotional",
      priority: "normal",
    });

    expect(res.sent).toBe(0);
    expect(res.failures).toContain("push_category_disabled");
    expect(enqueueNotificationDelivery).not.toHaveBeenCalled();
  });

  it("allows critical priority push to break through even if master is disabled", async () => {
    mockSb({
      prefs: { enabled: false },
      subscriptions: [
        {
          endpoint: "https://push.example.com/sub/123456789012345678901234",
          p256dh: "key",
          auth: "auth",
        },
      ],
    });

    const res = await sendPushToUser("user-1", {
      title: "Emergency Alert",
      body: "Vehicle safety notice",
      priority: "critical",
    });

    expect(res.sent).toBe(1);
    expect(res.failures).toHaveLength(0);
    expect(enqueueNotificationDelivery).not.toHaveBeenCalled();
  });

  it("does not enqueue when there are no subscriptions", async () => {
    mockSb({ prefs: { enabled: true }, subscriptions: [] });

    const res = await sendPushToUser("user-1", {
      title: "Hi",
      body: "There",
      priority: "high",
    });

    expect(res.failures).toContain("no_subscriptions");
    expect(enqueueNotificationDelivery).not.toHaveBeenCalled();
  });

  it("enqueues a retry when every endpoint fails transiently", async () => {
    mockSb({
      prefs: { enabled: true },
      subscriptions: [
        {
          endpoint: "https://push.example.com/sub/123456789012345678901234",
          p256dh: "key",
          auth: "auth",
        },
      ],
    });
    sendNotificationMock.mockRejectedValueOnce(
      Object.assign(new Error("upstream"), { statusCode: 503 }),
    );

    const res = await sendPushToUser("user-1", {
      title: "Chat",
      body: "On my way",
      url: "/messages/c1",
      tag: "msg-c1",
      category: "messages",
      priority: "high",
    });

    expect(res.sent).toBe(0);
    expect(enqueueNotificationDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        channel: "push",
        title: "Chat",
        body: "On my way",
        payload: expect.objectContaining({
          url: "/messages/c1",
          tag: "msg-c1",
          category: "messages",
          priority: "high",
        }),
      }),
    );
  });

  it("does not enqueue when noEnqueue is set (cron re-entry)", async () => {
    mockSb({
      prefs: { enabled: true },
      subscriptions: [
        {
          endpoint: "https://push.example.com/sub/123456789012345678901234",
          p256dh: "key",
          auth: "auth",
        },
      ],
    });
    sendNotificationMock.mockRejectedValueOnce(
      Object.assign(new Error("upstream"), { statusCode: 503 }),
    );

    await sendPushToUser(
      "user-1",
      { title: "Chat", body: "On my way", priority: "high" },
      { noEnqueue: true },
    );

    expect(enqueueNotificationDelivery).not.toHaveBeenCalled();
  });
});
