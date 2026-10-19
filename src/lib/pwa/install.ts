/**
 * PWA install awareness: platform detection, "already installed" signals and the
 * nudge policy. Pure functions plus a small localStorage store, so the rules are
 * unit-tested and the React hook stays thin.
 */

export type InstallPlatform = "ios" | "android" | "desktop" | "other";

export function detectPlatform(
  ua: string,
  maxTouchPoints = 0,
): InstallPlatform {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  // iPadOS 13+ reports as a Mac but has a touch screen.
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return "desktop";
  return "other";
}

/** Social/in-app webviews cannot install a PWA (iOS has no Add to Home Screen there). */
export function isInAppBrowser(ua: string): boolean {
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|Twitter|; wv\)/i.test(
    ua,
  );
}

type DisplayWindow = {
  matchMedia?: (q: string) => { matches: boolean };
  navigator?: unknown;
  document?: { referrer?: string };
};

/** True when Ona is running as an installed app (any platform), not in a browser tab. */
export function isStandaloneDisplay(win: DisplayWindow): boolean {
  try {
    const mm = win.matchMedia;
    if (
      mm &&
      [
        "standalone",
        "fullscreen",
        "minimal-ui",
        "window-controls-overlay",
      ].some((m) => mm(`(display-mode: ${m})`).matches)
    ) {
      return true;
    }
    if (
      (win.navigator as { standalone?: boolean } | undefined)?.standalone ===
      true
    ) {
      return true; // iOS Safari
    }
    if (win.document?.referrer?.startsWith("android-app://")) return true; // TWA
  } catch {
    /* fall through */
  }
  return false;
}

export type NudgeStore = {
  /** Set once Ona is known to be installed (standalone run, appinstalled, related apps). */
  installed: boolean;
  /** Browser sessions in which the app was opened (counts once per tab session). */
  visits: number;
  dismissCount: number;
  lastDismissedAt: number;
};

export const EMPTY_STORE: NudgeStore = {
  installed: false,
  visits: 0,
  dismissCount: 0,
  lastDismissedAt: 0,
};

export const NUDGE_STORE_KEY = "ona-pwa-nudge";
const DAY = 24 * 60 * 60 * 1000;

/** Ask again after 3 days, then 14, then every 60 (never nag a person who keeps saying no). */
export function snoozeMs(dismissCount: number): number {
  if (dismissCount <= 0) return 0;
  if (dismissCount === 1) return 3 * DAY;
  if (dismissCount === 2) return 14 * DAY;
  return 60 * DAY;
}

export function isSnoozed(store: NudgeStore, now: number): boolean {
  return now - store.lastDismissedAt < snoozeMs(store.dismissCount);
}

export function readStore(storage?: Pick<Storage, "getItem">): NudgeStore {
  try {
    const s = storage ?? window.localStorage;
    const o = JSON.parse(
      s.getItem(NUDGE_STORE_KEY) || "null",
    ) as Partial<NudgeStore> | null;
    if (!o || typeof o !== "object") return { ...EMPTY_STORE };
    return {
      installed: o.installed === true,
      visits: Number.isFinite(o.visits) ? Number(o.visits) : 0,
      dismissCount: Number.isFinite(o.dismissCount)
        ? Number(o.dismissCount)
        : 0,
      lastDismissedAt: Number.isFinite(o.lastDismissedAt)
        ? Number(o.lastDismissedAt)
        : 0,
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

export function writeStore(
  store: NudgeStore,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    (storage ?? window.localStorage).setItem(
      NUDGE_STORE_KEY,
      JSON.stringify(store),
    );
  } catch {
    /* private mode: the nudge simply cannot remember */
  }
}

export type NudgeInput = {
  store: NudgeStore;
  now: number;
  platform: InstallPlatform;
  standalone: boolean;
  inApp: boolean;
  /** Chromium handed us a deferred `beforeinstallprompt` (so the app is installable and NOT installed). */
  canPrompt: boolean;
};

/** Minimum number of separate visits before the first nudge. */
export const MIN_VISITS = 2;

export type NudgeMode = "prompt" | "ios" | null;

/**
 * Which nudge (if any) to show right now.
 * - never inside the installed app, nor once installed is known
 * - Android/desktop: only when the browser really offers the install prompt
 * - iOS: Safari only (in-app browsers cannot install), with manual steps
 * - respects snooze and waits for a repeat visit
 */
export function nudgeMode(i: NudgeInput): NudgeMode {
  if (i.standalone || i.store.installed) return null;
  if (i.store.visits < MIN_VISITS) return null;
  if (isSnoozed(i.store, i.now)) return null;
  if (i.platform === "ios") return i.inApp ? null : "ios";
  if (i.canPrompt) return "prompt";
  return null;
}
