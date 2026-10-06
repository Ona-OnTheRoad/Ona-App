import {
  getQuietHours,
  setQuietHours,
  QUIET_HOURS_ANYTIME,
} from "@/lib/notifications/quiet-hours";
import type { NotificationSettingsState } from "./types";

const STORAGE_KEY = "ona-notification-settings";

export const DEFAULT_SETTINGS: NotificationSettingsState = {
  enabled: true,
  categories: {
    // Transactional ON by default
    requests: true,
    messages: true,
    payments: true,
    system: true,
    // Promotional OFF by default
    promotional: false,
  },
  delivery: {
    push: true,
    sms: false,
    email: true,
    inApp: true,
  },
  quietHours: {
    enabled: true,
    startHour: 22,
    endHour: 7,
  },
};

export function readSettings(userKey: string): NotificationSettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userKey}`);
    if (!raw) {
      const qh = getQuietHours();
      return { ...DEFAULT_SETTINGS, quietHours: qh };
    }
    const p = JSON.parse(raw) as Partial<NotificationSettingsState>;
    return {
      enabled: p.enabled !== false,
      categories: {
        requests: p.categories?.requests !== false,
        messages: p.categories?.messages !== false,
        payments: p.categories?.payments !== false,
        system: p.categories?.system !== false,
        // Promo defaults OFF unless user explicitly enabled
        promotional: p.categories?.promotional === true,
      },
      delivery: {
        push: p.delivery?.push !== false,
        sms: p.delivery?.sms === true,
        email: p.delivery?.email !== false,
        inApp: p.delivery?.inApp !== false,
      },
      quietHours: {
        enabled: p.quietHours?.enabled !== false,
        startHour:
          Number(p.quietHours?.startHour) === QUIET_HOURS_ANYTIME
            ? QUIET_HOURS_ANYTIME
            : Number.isFinite(p.quietHours?.startHour) &&
                Number(p.quietHours?.startHour) >= 0 &&
                Number(p.quietHours?.startHour) <= 23
              ? Number(p.quietHours?.startHour)
              : 22,
        endHour:
          Number(p.quietHours?.endHour) === QUIET_HOURS_ANYTIME
            ? QUIET_HOURS_ANYTIME
            : Number.isFinite(p.quietHours?.endHour) &&
                Number(p.quietHours?.endHour) >= 0 &&
                Number(p.quietHours?.endHour) <= 23
              ? Number(p.quietHours?.endHour)
              : 7,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(userKey: string, s: NotificationSettingsState) {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${userKey}`, JSON.stringify(s));
    setQuietHours(s.quietHours);
  } catch {
    /* ignore quota */
  }
}
