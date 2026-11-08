"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { enablePushNotifications, isPushDeliveryAllowed } from "@/lib/push/client";
import {
  PUSH_PROMPT_SNOOZE_KEY,
  PUSH_PROMPT_SNOOZE_MS,
  decidePushPrompt,
} from "@/lib/push/prompt";
import { useApp } from "@/lib/store";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";

const TOAST_ID = "push-enrollment";
/** Let the screen settle before asking, so it never greets someone mid-task. */
const PROMPT_DELAY_MS = 10_000;

function readSnooze(): number {
  try {
    return Number(localStorage.getItem(PUSH_PROMPT_SNOOZE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function snooze() {
  try {
    localStorage.setItem(
      PUSH_PROMPT_SNOOZE_KEY,
      String(Date.now() + PUSH_PROMPT_SNOOZE_MS),
    );
  } catch {
    /* private mode */
  }
}

/**
 * Gets every signed-in user (customer or pro) onto web push so job, offer,
 * payment and chat alerts reach the phone with the app closed.
 * - Permission already granted: re-syncs the subscription silently.
 * - Not decided yet: a snackbar with a "Turn on" button (the tap is what lets
 *   iOS show the permission dialog). "Not now" snoozes it for a week.
 */
export function PushEnrollment() {
  const { isAuthenticated, authReady, backendUserId } = useApp();

  useEffect(() => {
    if (!authReady || !isAuthenticated || !backendUserId) return;
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    const pushSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    const mode = decidePushPrompt({
      signedIn: true,
      deliveryAllowed: isPushDeliveryAllowed(backendUserId),
      pushSupported,
      permission: pushSupported ? Notification.permission : "unsupported",
      snoozedUntil: readSnooze(),
      now: Date.now(),
    });

    if (mode === "sync") {
      void enablePushNotifications(backendUserId);
      return;
    }
    if (mode !== "ask") return;

    const timer = window.setTimeout(() => {
      toast("Get alerts for new requests, offers and messages", {
        id: TOAST_ID,
        description: "Works even when the app is closed.",
        duration: Infinity,
        action: {
          label: "Turn on",
          onClick: () => {
            void enablePushNotifications(backendUserId, { interactive: true }).then(
              (ok) => {
                if (ok) toastSuccess("Notifications are on.");
                else if (Notification.permission === "denied") {
                  toastInfo(
                    "Notifications are blocked. Turn them on in your browser or phone settings.",
                  );
                } else {
                  toastError("Could not turn on notifications. Try again later.");
                }
              },
            );
          },
        },
        cancel: { label: "Not now", onClick: snooze },
        onDismiss: snooze,
      });
    }, PROMPT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      toast.dismiss(TOAST_ID);
    };
  }, [authReady, isAuthenticated, backendUserId]);

  return null;
}
