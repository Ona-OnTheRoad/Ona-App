/**
 * Unread count on the installed app's icon (Badging API). Silently does
 * nothing where the browser does not support it.
 */
export function syncAppBadge(count: number): void {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count > 0 && nav.setAppBadge) {
      void nav.setAppBadge(count).catch(() => {});
    } else if (count <= 0 && nav.clearAppBadge) {
      void nav.clearAppBadge().catch(() => {});
    }
  } catch {
    /* badging is optional */
  }
}
