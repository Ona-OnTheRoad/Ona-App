import type { QuietHoursConfig } from "@/lib/notifications/quiet-hours";

export type NotificationCategoryPref = {
  requests: boolean;
  messages: boolean;
  payments: boolean;
  system: boolean;
  /** Marketing / tips OFF by default (polite) */
  promotional: boolean;
};

export type NotificationDeliveryPref = {
  push: boolean;
  sms: boolean;
  email: boolean;
  /** In-app inbox banners & center */
  inApp: boolean;
};

export type NotificationSettingsState = {
  enabled: boolean;
  categories: NotificationCategoryPref;
  delivery: NotificationDeliveryPref;
  quietHours: QuietHoursConfig;
};
