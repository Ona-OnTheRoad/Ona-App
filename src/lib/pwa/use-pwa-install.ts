"use client";

import { useCallback, useEffect, useState } from "react";
import {
  detectPlatform,
  isInAppBrowser,
  isStandaloneDisplay,
  nudgeMode,
  readStore,
  writeStore,
  type InstallPlatform,
  type NudgeMode,
  type NudgeStore,
} from "./install";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SESSION_KEY = "ona-pwa-session";

// The browser fires `beforeinstallprompt` once; keep it at module level so it
// survives route changes and component remounts.
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function update(patch: Partial<NudgeStore>) {
  writeStore({ ...readStore(), ...patch });
  notify();
}

function markInstalled() {
  deferred = null;
  update({ installed: true });
}

function recordDismiss() {
  const s = readStore();
  update({ dismissCount: s.dismissCount + 1, lastDismissedAt: Date.now() });
}

/** Count one visit per browser session. */
function countVisit() {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    return;
  }
  update({ visits: readStore().visits + 1 });
}

async function relatedAppInstalled(): Promise<boolean> {
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<unknown[]>;
  };
  try {
    return ((await nav.getInstalledRelatedApps?.()) ?? []).length > 0;
  } catch {
    return false;
  }
}

export type PwaInstall = {
  platform: InstallPlatform;
  /** "prompt" = native install dialog (Android/desktop), "ios" = Share → Add to Home Screen steps. */
  mode: NudgeMode;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** "Not now": snoozes the nudge (longer each time). */
  dismiss: () => void;
};

/**
 * Tracks whether Ona is installed and whether to nudge. Signals: standalone display
 * (any OS), the `appinstalled` event, `getInstalledRelatedApps()` (Android), and
 * `beforeinstallprompt`, which Chromium only fires when the app is NOT installed
 * (so it also clears a stale "installed" flag after an uninstall). iOS exposes no
 * such signal inside Safari, so iOS relies on running standalone to know.
 */
export function usePwaInstall(): PwaInstall {
  // `now` lives in state (set in effects) so render stays pure; 0 keeps the nudge
  // hidden until the first client effect has run.
  // `v` forces a re-render on every store change even within the same millisecond.
  const [clock, setClock] = useState({ now: 0, v: 0 });
  const [env, setEnv] = useState({
    platform: "other" as InstallPlatform,
    standalone: false,
    inApp: false,
  });

  useEffect(() => {
    const sync = () => setClock((c) => ({ now: Date.now(), v: c.v + 1 }));
    listeners.add(sync);
    sync();

    const ua = navigator.userAgent;
    const standalone = isStandaloneDisplay(window);
    setEnv({
      platform: detectPlatform(ua, navigator.maxTouchPoints),
      standalone,
      inApp: isInAppBrowser(ua),
    });
    if (standalone) update({ installed: true });
    else {
      countVisit();
      void relatedAppInstalled().then((yes) => yes && markInstalled());
    }

    // The root layout captures the event before React hydrates; pick it up here.
    const early = (window as Window & { __onaInstallPrompt?: Event })
      .__onaInstallPrompt;
    if (early && !deferred && !standalone) {
      deferred = early as InstallPromptEvent;
      if (readStore().installed) update({ installed: false });
      else notify();
    }

    const onPrompt = (e: Event) => {
      // Inside the installed app there is nothing to install.
      if (isStandaloneDisplay(window)) return;
      e.preventDefault();
      deferred = e as InstallPromptEvent;
      // Chromium only offers the prompt when the app is not installed.
      if (readStore().installed) update({ installed: false });
      else notify();
    };
    const onInstalled = () => markInstalled();
    const mq = window.matchMedia("(display-mode: standalone)");
    const onDisplay = () => {
      if (mq.matches) {
        setEnv((p) => ({ ...p, standalone: true }));
        update({ installed: true });
      }
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    mq.addEventListener?.("change", onDisplay);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onDisplay);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const evt = deferred;
    if (!evt) return "unavailable" as const;
    deferred = null;
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "accepted") markInstalled();
      else recordDismiss();
      return outcome;
    } catch {
      notify();
      return "unavailable" as const;
    }
  }, []);

  const mode = nudgeMode({
    store: readStore(),
    now: clock.now,
    platform: env.platform,
    standalone: env.standalone,
    inApp: env.inApp,
    canPrompt: deferred !== null,
  });

  return {
    platform: env.platform,
    mode,
    promptInstall,
    dismiss: recordDismiss,
  };
}
