"use client";

/**
 * NotificationCenter icon filters, flat X-style notification cards.
 * Every item renders with the same anatomy as the in-app toasts: category icon
 * chip (orange for high priority), "Ona · time" header, bold title, muted body,
 * action chip, unread dot. Read: solid grey action chips. Unread: orange.
 * Mark read on card click / hover no separate "Mark read" control.
 */

import { useNotifications } from "@/components/notifications/notification-provider";
import { useApp } from "@/lib/store";
import { NotificationsView } from "./notifications-view";

export function NotificationCenter() {
  const { centerOpen, closeCenter } = useNotifications();
  const { theme } = useApp();
  const isLight = theme === "light";

  if (!centerOpen) return null;

  return (
    <div
      className="absolute inset-0 z-[95] flex flex-col"
      role="dialog"
      aria-modal
      aria-label="Notifications"
    >
      <button
        type="button"
        className="absolute inset-0 border-0"
        style={{ backgroundColor: isLight ? "#00000055" : "#00000099" }}
        aria-label="Close notifications"
        onClick={closeCenter}
      />
      <div className="relative z-10 mt-auto flex h-[92%] max-h-full w-full animate-[om-sheet-up_0.28s_ease-out] flex-col bg-ona-bg sm:ml-auto sm:mt-0 sm:h-full sm:max-w-[400px]">
        <NotificationsView onBack={closeCenter} />
      </div>
    </div>
  );
}
