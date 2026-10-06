export type Banner = {
  kind: "message";
  id: string;
  title: string;
  body: string;
  href: string;
  who: string;
} | null;

/**
 * Anchors survive a reload: store the per-thread "already seen" timestamps in
 * sessionStorage (keyed by role) so a fresh page load re-seeds from what was
 * absorbed before and old chat history can never replay as popups.
 */
const SEEN_ANCHORS_KEY = "ona-inbound-seen-anchors";

export function loadSeenAnchors(role: string): Record<string, string> {
  try {
    const raw = window.sessionStorage.getItem(SEEN_ANCHORS_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as Record<string, Record<string, string>>;
    return all[role] || {};
  } catch {
    return {};
  }
}

export function saveSeenAnchors(role: string, maps: Map<string, string>): void {
  try {
    const raw = window.sessionStorage.getItem(SEEN_ANCHORS_KEY);
    const all = raw
      ? (JSON.parse(raw) as Record<string, Record<string, string>>)
      : {};
    all[role] = Object.fromEntries(maps);
    window.sessionStorage.setItem(SEEN_ANCHORS_KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}
