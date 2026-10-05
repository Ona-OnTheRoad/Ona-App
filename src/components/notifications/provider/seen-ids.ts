/**
 * Seen-notification ids survive reload + role-switch: seed known/toasted sets
 * from sessionStorage so Realtime replay of already-acknowledged rows is a
 * no-op (old rows can never re-toast after a fresh page or a role flip).
 */
const SEEN_NOTIF_KEY = "ona-notif-seen-ids";

export function readSeenNotifIds(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(SEEN_NOTIF_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function persistSeenNotifIds(ids: Set<string>): void {
  try {
    window.sessionStorage.setItem(SEEN_NOTIF_KEY, JSON.stringify([...ids]));
  } catch {
    /* private mode */
  }
}
