import { MessageCircle, Star, Wallet, type LucideIcon } from "lucide-react";
import type { AppNotification } from "@/lib/notifications/types";

/** Per-action icon + label that replaces the old text chips (X-style icon actions). */
export type ActionSpec = { icon: LucideIcon | null; label: string };

export function actionSpec(
  n: AppNotification,
  opts: {
    navBlocked: boolean;
    accountType?: string | null;
    releasePay: boolean;
  },
): ActionSpec | null {
  const { navBlocked, accountType, releasePay } = opts;
  if (n.actionType === "open_chat" || n.category === "messages") {
    return { icon: MessageCircle, label: navBlocked ? "Open" : "Open chat" };
  }
  if (n.actionType === "accept_request") {
    return {
      icon: null,
      label: navBlocked
        ? "Open"
        : accountType === "professional"
          ? "Open request"
          : "Open",
    };
  }
  if (n.actionType === "view_tracking") {
    return { icon: null, label: navBlocked ? "Open" : "Track" };
  }
  if (
    n.actionType === "open_job" ||
    n.category === "requests" ||
    (n.category === "payments" && releasePay)
  ) {
    return {
      icon: null,
      label: releasePay
        ? "Confirm job & release payment"
        : navBlocked
          ? "Open"
          : "Open job",
    };
  }
  if (n.actionType === "view_payment" && !releasePay) {
    return { icon: Wallet, label: "Payments" };
  }
  if (n.actionType === "rate") {
    return { icon: Star, label: "Rate" };
  }
  if (!n.actionType && n.href) {
    return { icon: null, label: navBlocked ? "Open" : "Open" };
  }
  return null;
}
