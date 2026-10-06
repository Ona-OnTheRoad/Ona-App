import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Wallet,
  Wrench,
  Settings2,
} from "lucide-react";
import { QUIET_HOURS_ANYTIME } from "@/lib/notifications/quiet-hours";
import type {
  NotificationCategoryPref,
  NotificationDeliveryPref,
} from "./types";

export const CATEGORY_ROWS: {
  key: keyof NotificationCategoryPref;
  label: string;
  detail: string;
  icon: typeof Bell;
}[] = [
  {
    key: "requests",
    label: "Bookings & jobs",
    detail: "Requests, confirmations, reschedules, cancellations",
    icon: Wrench,
  },
  {
    key: "messages",
    label: "Chat",
    detail: "Messages between customers and Repair Pros",
    icon: MessageSquare,
  },
  {
    key: "payments",
    label: "Payments & receipts",
    detail: "Escrow, payouts, refunds, receipts",
    icon: Wallet,
  },
  {
    key: "system",
    label: "Reminders & account",
    detail: "Appointment reminders, verification, Live status",
    icon: Settings2,
  },
  {
    key: "promotional",
    label: "Promotions & tips",
    detail: "Offers, credits, product marketing (default off)",
    icon: Bell,
  },
];

export const DELIVERY_ROWS: {
  key: keyof NotificationDeliveryPref;
  label: string;
  detail: string;
  icon: typeof Bell;
}[] = [
  {
    key: "push",
    label: "Push",
    detail: "Device alerts when the app is closed",
    icon: Smartphone,
  },
  {
    key: "inApp",
    label: "In-app",
    detail: "Banners and notification center",
    icon: Bell,
  },
  {
    key: "sms",
    label: "SMS",
    detail: "Text for critical job updates",
    icon: MessageSquare,
  },
  {
    key: "email",
    label: "Email",
    detail: "Summaries and receipts",
    icon: Mail,
  },
];

export function hourLabel(h: number): string {
  if (h === QUIET_HOURS_ANYTIME) return "Anytime";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${period}`;
}

export const HOUR_OPTIONS: number[] = [
  QUIET_HOURS_ANYTIME,
  ...Array.from({ length: 24 }, (_, h) => h),
];
