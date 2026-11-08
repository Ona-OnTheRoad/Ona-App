"use client";

/**
 * Client-side Web Push enrollment. Registers the service worker, subscribes,
 * and saves the subscription to the server, once per session for any signed-in
 * user (customers and pros). Everything is best-effort: a failed/paused push
 * setup never blocks the app.
 *
 * Asking for the OS permission is only done when `interactive` is true, and it
 * must come from a user tap (iOS ignores prompts that are not). Silent calls
 * just re-sync a subscription that was already allowed.
 */

const SETTINGS_STORAGE_KEY = "ona-notification-settings";

let enrolling = false;
let enrolledPromise: Promise<boolean> | null = null;

/** Respect the user's "push" delivery switch in Settings (default on). */
export function isPushDeliveryAllowed(userId?: string | null): boolean {
  if (!userId || typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(`${SETTINGS_STORAGE_KEY}:${userId}`);
    if (!raw) return true;
    const p = JSON.parse(raw) as { delivery?: { push?: boolean } };
    return p.delivery?.push !== false;
  } catch {
    return true;
  }
}

export async function enablePushNotifications(
  userId?: string | null,
  opts?: { interactive?: boolean },
): Promise<boolean> {
  const interactive = opts?.interactive ?? false;
  if (!isPushDeliveryAllowed(userId)) return false;
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return false;
  }
  if (Notification.permission === "denied") return false;
  // Never prompt unless this call comes from a tap.
  if (Notification.permission === "default" && !interactive) return false;

  // Only one enrollment in flight (and never repeated after success).
  if (enrolling) return enrolledPromise ?? false;
  if (enrolledPromise) return enrolledPromise;

  enrolling = true;
  const attempt = (async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      if (Notification.permission === "default") {
        const granted = await Notification.requestPermission();
        if (granted !== "granted") return false;
      }
      const keyRes = await fetch("/api/push/vapid-key");
      if (!keyRes.ok) return false;
      const { publicKey } = (await keyRes.json()) as { publicKey?: string };
      if (!publicKey) return false;

      let sub = await reg.pushManager.getSubscription();
      if (!sub || !sub.endpoint) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
      }
      const raw = sub.toJSON();
      if (!raw.endpoint || !raw.keys) return false;

      const saveRes = await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: raw }),
      });
      return saveRes.ok;
    } catch {
      return false;
    } finally {
      enrolling = false;
    }
  })();
  enrolledPromise = attempt;
  // A failed or dismissed attempt must not block a later retry.
  void attempt.then((ok) => {
    if (!ok && enrolledPromise === attempt) enrolledPromise = null;
  });
  return attempt;
}

/**
 * Sign-out on this device: stop the server pushing the previous user's alerts
 * here (shared phones). The browser subscription itself is kept so signing back
 * in is instant. Best-effort and never throws.
 */
export async function unregisterPushOnThisDevice(): Promise<void> {
  try {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub?.endpoint) {
      await fetch("/api/push/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => null);
    }
  } catch {
    /* best-effort */
  } finally {
    resetPushEnrollment();
  }
}

/** Forget the cached enrollment (call on sign-out so the next user re-syncs). */
export function resetPushEnrollment(): void {
  enrolledPromise = null;
  enrolling = false;
}
