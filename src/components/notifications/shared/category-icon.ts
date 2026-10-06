import {
  Info,
  MessageCircle,
  Phone,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  AppNotification,
  NotificationCategory,
} from "@/lib/notifications/types";
import {
  isCallNotification,
  isChatNotification,
  isPaymentNotification,
  isRequestAcceptNotification,
} from "@/lib/notifications/stack-rules";

/** Per-category icon shared by the notification center and in-app toasts. */
export function categoryIcon(n: AppNotification): LucideIcon {
  if (isCallNotification(n)) return Phone;
  if (isChatNotification(n)) return MessageCircle;
  if (isPaymentNotification(n)) return Wallet;
  if (isRequestAcceptNotification(n) || n.category === "requests")
    return Wrench;
  switch (n.category as NotificationCategory) {
    case "requests":
      return Wrench;
    case "messages":
      return MessageCircle;
    case "payments":
      return Wallet;
    default:
      return Info;
  }
}
