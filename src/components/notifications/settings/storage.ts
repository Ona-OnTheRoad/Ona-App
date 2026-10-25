import {
  getQuietHours,
  setQuietHours,
  QUIET_HOURS_ANYTIME,
} from "@/lib/notifications/quiet-hours";
import type { NotificationSettingsState } from "./types";

const STORAGE_KEY = "ona-notification-settings";
export const NOTIFICATION_SETTINGS_CHANGED_EVENT =
  "ona-notification-settings-changed";

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

export function parseNotificationSettings(
  raw: unknown,
): NotificationSettingsState {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const p = raw as Partial<NotificationSettingsState> & {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    jobAlerts?: boolean;
    messageAlerts?: boolean;
    promotionalAlerts?: boolean;
    quietHoursStart?: string | number;
    quietHoursEnd?: string | number;
  };
  return {
    enabled: p.enabled !== false,
    categories: {
      requests:
        p.categories?.requests ??
        (p.jobAlerts !== undefined ? p.jobAlerts : true),
      messages:
        p.categories?.messages ??
        (p.messageAlerts !== undefined ? p.messageAlerts : true),
      payments: p.categories?.payments !== false,
      system: p.categories?.system !== false,
      // Promo defaults OFF unless user explicitly enabled
      promotional:
        p.categories?.promotional ??
        (p.promotionalAlerts !== undefined ? p.promotionalAlerts : false),
    },
    delivery: {
      push:
        p.delivery?.push ??
        (p.pushEnabled !== undefined ? p.pushEnabled : true),
      sms:
        p.delivery?.sms ??
        (p.smsEnabled !== undefined ? p.smsEnabled : false),
      email:
        p.delivery?.email ??
        (p.emailEnabled !== undefined ? p.emailEnabled : true),
      inApp: p.delivery?.inApp !== false,
    },
    quietHours: {
      enabled: p.quietHours?.enabled !== false,
      startHour:
        Number(p.quietHours?.startHour ?? p.quietHoursStart) ===
        QUIET_HOURS_ANYTIME
          ? QUIET_HOURS_ANYTIME
          : Number.isFinite(
                Number(p.quietHours?.startHour ?? p.quietHoursStart),
              ) &&
              Number(p.quietHours?.startHour ?? p.quietHoursStart) >= 0 &&
              Number(p.quietHours?.startHour ?? p.quietHoursStart) <= 23
            ? Number(p.quietHours?.startHour ?? p.quietHoursStart)
            : 22,
      endHour:
        Number(p.quietHours?.endHour ?? p.quietHoursEnd) === QUIET_HOURS_ANYTIME
          ? QUIET_HOURS_ANYTIME
          : Number.isFinite(
                Number(p.quietHours?.endHour ?? p.quietHoursEnd),
              ) &&
              Number(p.quietHours?.endHour ?? p.quietHoursEnd) >= 0 &&
              Number(p.quietHours?.endHour ?? p.quietHoursEnd) <= 23
            ? Number(p.quietHours?.endHour ?? p.quietHoursEnd)
            : 7,
    },
  };
}

export function readSettings(userKey: string): NotificationSettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userKey}`);
    if (!raw) {
      const qh = getQuietHours();
      return { ...DEFAULT_SETTINGS, quietHours: qh };
    }
    return parseNotificationSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(userKey: string, s: NotificationSettingsState) {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${userKey}`, JSON.stringify(s));
    setQuietHours(s.quietHours);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(NOTIFICATION_SETTINGS_CHANGED_EVENT, { detail: s }),
      );
    }
  } catch {
    /* ignore quota */
  }
}

export function hasPendingSync(userKey: string): boolean {
  if (typeof window === "undefined" || !userKey || userKey === "guest") return false;
  try {
    return localStorage.getItem(`${STORAGE_KEY}-pending:${userKey}`) === "true";
  } catch {
    return false;
  }
}

export function setPendingSync(userKey: string, pending: boolean): void {
  if (typeof window === "undefined" || !userKey || userKey === "guest") return;
  try {
    if (pending) {
      localStorage.setItem(`${STORAGE_KEY}-pending:${userKey}`, "true");
    } else {
      localStorage.removeItem(`${STORAGE_KEY}-pending:${userKey}`);
    }
  } catch {
    /* ignore quota */
  }
}
