// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  NOTIFICATION_SETTINGS_CHANGED_EVENT,
  parseNotificationSettings,
  readSettings,
  writeSettings,
} from "../storage";

describe("Notification Settings Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default settings when storage is empty", () => {
    const s = readSettings("user-1");
    expect(s.enabled).toBe(true);
    expect(s.categories.requests).toBe(true);
    expect(s.categories.promotional).toBe(false);
    expect(s.delivery.push).toBe(true);
    expect(s.delivery.sms).toBe(false);
  });

  it("writes and reads back notification settings", () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      enabled: false,
      categories: { ...DEFAULT_SETTINGS.categories, promotional: true },
      delivery: { ...DEFAULT_SETTINGS.delivery, push: false },
    };
    writeSettings("user-1", custom);

    const loaded = readSettings("user-1");
    expect(loaded.enabled).toBe(false);
    expect(loaded.categories.promotional).toBe(true);
    expect(loaded.delivery.push).toBe(false);
  });

  it("dispatches NOTIFICATION_SETTINGS_CHANGED_EVENT on write", () => {
    let received: unknown = null;
    const handler = (e: Event) => {
      received = (e as CustomEvent).detail;
    };
    window.addEventListener(NOTIFICATION_SETTINGS_CHANGED_EVENT, handler);

    const custom = { ...DEFAULT_SETTINGS, enabled: false };
    writeSettings("user-2", custom);

    expect(received).toEqual(custom);
    window.removeEventListener(NOTIFICATION_SETTINGS_CHANGED_EVENT, handler);
  });

  it("parses backward-compatible flat keys correctly", () => {
    const legacy = {
      pushEnabled: false,
      jobAlerts: false,
      messageAlerts: true,
      promotionalAlerts: true,
      quietHoursStart: 23,
      quietHoursEnd: 6,
    };
    const parsed = parseNotificationSettings(legacy);
    expect(parsed.delivery.push).toBe(false);
    expect(parsed.categories.requests).toBe(false);
    expect(parsed.categories.messages).toBe(true);
    expect(parsed.categories.promotional).toBe(true);
    expect(parsed.quietHours.startHour).toBe(23);
    expect(parsed.quietHours.endHour).toBe(6);
  });
});
