// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestPermission = vi.fn();
const subscribe = vi.fn();
const getSubscription = vi.fn();
const fetchMock = vi.fn();

function install(permission: NotificationPermission) {
  vi.stubGlobal("Notification", Object.assign(function () {}, { permission, requestPermission }));
  (window as unknown as Record<string, unknown>).PushManager = function () {};
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      register: vi.fn(async () => ({ pushManager: { getSubscription, subscribe } })),
      getRegistration: vi.fn(async () => ({ pushManager: { getSubscription } })),
    },
  });
}
const sub = { endpoint: "https://push.example/e1", toJSON: () => ({ endpoint: "https://push.example/e1", keys: { p256dh: "k", auth: "a" } }) };

let client: typeof import("./client");
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
  getSubscription.mockResolvedValue(null);
  subscribe.mockResolvedValue(sub);
  fetchMock.mockImplementation(async (url: string) =>
    String(url).includes("vapid-key")
      ? { ok: true, json: async () => ({ publicKey: "pub" }) }
      : { ok: true, json: async () => ({}) },
  );
  vi.stubGlobal("fetch", fetchMock);
  client = await import("./client");
});
afterEach(() => vi.unstubAllGlobals());

describe("enablePushNotifications", () => {
  it("never shows the permission dialog unless the call came from a tap", async () => {
    install("default");
    expect(await client.enablePushNotifications("u1")).toBe(false);
    expect(requestPermission).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("asks and subscribes on a tap, then saves the subscription", async () => {
    install("default");
    requestPermission.mockResolvedValue("granted");
    expect(await client.enablePushNotifications("u1", { interactive: true })).toBe(true);
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/push/register", expect.objectContaining({ method: "POST" }));
  });

  it("quietly re-syncs when permission was already granted", async () => {
    install("granted");
    expect(await client.enablePushNotifications("u1")).toBe(true);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("can be retried after the user dismissed the dialog", async () => {
    install("default");
    requestPermission.mockResolvedValueOnce("default").mockResolvedValueOnce("granted");
    expect(await client.enablePushNotifications("u1", { interactive: true })).toBe(false);
    expect(await client.enablePushNotifications("u1", { interactive: true })).toBe(true);
  });

  it("respects the Settings switch and a blocked permission", async () => {
    install("granted");
    localStorage.setItem("ona-notification-settings:u1", JSON.stringify({ delivery: { push: false } }));
    expect(await client.enablePushNotifications("u1")).toBe(false);
    install("denied");
    expect(await client.enablePushNotifications("u2", { interactive: true })).toBe(false);
  });
});

describe("unregisterPushOnThisDevice", () => {
  it("removes this device from the signed-in user on logout", async () => {
    install("granted");
    getSubscription.mockResolvedValue(sub);
    await client.unregisterPushOnThisDevice();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/push/register",
      expect.objectContaining({ method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint }) }),
    );
  });
});
