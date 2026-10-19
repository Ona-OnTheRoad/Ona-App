import { describe, expect, it } from "vitest";
import {
  EMPTY_STORE,
  MIN_VISITS,
  detectPlatform,
  isInAppBrowser,
  isSnoozed,
  isStandaloneDisplay,
  nudgeMode,
  snoozeMs,
  type NudgeInput,
} from "./install";

const DAY = 24 * 60 * 60 * 1000;
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

describe("platform detection", () => {
  it("detects iOS, iPadOS (Mac UA + touch), Android and desktop", () => {
    expect(detectPlatform(IPHONE)).toBe("ios");
    expect(
      detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5),
    ).toBe("ios");
    expect(
      detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0),
    ).toBe("desktop");
    expect(detectPlatform(ANDROID)).toBe("android");
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      "desktop",
    );
  });

  it("flags in-app browsers", () => {
    expect(isInAppBrowser(IPHONE + " Instagram 300.0")).toBe(true);
    expect(isInAppBrowser(IPHONE + " [FBAN/FBIOS;FBAV/450]")).toBe(true);
    expect(isInAppBrowser(IPHONE)).toBe(false);
    expect(isInAppBrowser(ANDROID)).toBe(false);
  });
});

describe("installed-app detection", () => {
  const mm = (on: string) => (q: string) => ({ matches: q.includes(on) });
  it("recognises display-mode standalone, iOS navigator.standalone and TWA referrer", () => {
    expect(isStandaloneDisplay({ matchMedia: mm("standalone") })).toBe(true);
    expect(
      isStandaloneDisplay({
        matchMedia: mm("none"),
        navigator: { standalone: true },
      }),
    ).toBe(true);
    expect(
      isStandaloneDisplay({
        matchMedia: mm("none"),
        document: { referrer: "android-app://africa.semicolon" },
      }),
    ).toBe(true);
    expect(
      isStandaloneDisplay({
        matchMedia: mm("browser"),
        navigator: {},
        document: { referrer: "" },
      }),
    ).toBe(false);
  });
});

describe("snooze", () => {
  it("backs off 3 → 14 → 60 days", () => {
    expect(snoozeMs(0)).toBe(0);
    expect(snoozeMs(1)).toBe(3 * DAY);
    expect(snoozeMs(2)).toBe(14 * DAY);
    expect(snoozeMs(5)).toBe(60 * DAY);
  });
  it("is snoozed only inside the window", () => {
    const s = { ...EMPTY_STORE, dismissCount: 1, lastDismissedAt: 1000 };
    expect(isSnoozed(s, 1000 + 2 * DAY)).toBe(true);
    expect(isSnoozed(s, 1000 + 4 * DAY)).toBe(false);
  });
});

describe("nudgeMode", () => {
  const base: NudgeInput = {
    store: { ...EMPTY_STORE, visits: MIN_VISITS },
    now: 10 * DAY,
    platform: "android",
    standalone: false,
    inApp: false,
    canPrompt: true,
  };

  it("prompts on Android/desktop only when the browser offers the install prompt", () => {
    expect(nudgeMode(base)).toBe("prompt");
    expect(nudgeMode({ ...base, canPrompt: false })).toBeNull();
  });

  it("shows manual steps on iOS Safari, nothing in iOS in-app browsers", () => {
    expect(nudgeMode({ ...base, platform: "ios", canPrompt: false })).toBe(
      "ios",
    );
    expect(nudgeMode({ ...base, platform: "ios", inApp: true })).toBeNull();
  });

  it("never nudges inside the installed app or once installed", () => {
    expect(nudgeMode({ ...base, standalone: true })).toBeNull();
    expect(
      nudgeMode({ ...base, store: { ...base.store, installed: true } }),
    ).toBeNull();
  });

  it("waits for a repeat visit and respects the snooze", () => {
    expect(
      nudgeMode({ ...base, store: { ...base.store, visits: 1 } }),
    ).toBeNull();
    expect(
      nudgeMode({
        ...base,
        store: {
          ...base.store,
          dismissCount: 1,
          lastDismissedAt: 10 * DAY - DAY,
        },
      }),
    ).toBeNull();
  });
});
