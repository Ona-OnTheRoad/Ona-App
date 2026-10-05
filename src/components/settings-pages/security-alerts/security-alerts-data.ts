export const PREFS_KEY = "ona-security-alerts-prefs-v1";
export const FEED_KEY = "ona-security-alerts-feed-v1";

export type Prefs = {
  newLogin: boolean;
  passwordChange: boolean;
  deviceChange: boolean;
  pushCopy: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  newLogin: true,
  passwordChange: true,
  deviceChange: true,
  pushCopy: true,
};

export type AlertItem = {
  id: string;
  type: "login" | "password" | "device" | "other";
  title: string;
  body: string;
  at: string;
  read: boolean;
};

export function loadPrefs(uid: string): Prefs {
  try {
    const raw = localStorage.getItem(`${PREFS_KEY}:${uid}`);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function loadFeed(uid: string): AlertItem[] {
  try {
    const raw = localStorage.getItem(`${FEED_KEY}:${uid}`);
    if (!raw) return [];
    const arr = JSON.parse(raw) as AlertItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveFeed(uid: string, items: AlertItem[]) {
  try {
    localStorage.setItem(
      `${FEED_KEY}:${uid}`,
      JSON.stringify(items.slice(0, 40)),
    );
  } catch {
    /* */
  }
}
