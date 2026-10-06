"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PREFS,
  PREFS_KEY,
  loadFeed,
  loadPrefs,
  saveFeed,
  type AlertItem,
  type Prefs,
} from "./security-alerts-data";

export function useSecurityAlerts(uid: string, isAuthenticated: boolean) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [feed, setFeed] = useState<AlertItem[]>([]);

  useEffect(() => {
    setPrefs(loadPrefs(uid));
    let items = loadFeed(uid);
    // Seed a helpful empty-state sample once for signed-in users
    if (items.length === 0 && isAuthenticated) {
      items = [
        {
          id: `seed-${Date.now()}`,
          type: "other",
          title: "Security alerts are on",
          body: "You’ll see new logins, password changes, and device sign-outs here.",
          at: new Date().toISOString(),
          read: false,
        },
      ];
      saveFeed(uid, items);
    }
    setFeed(items);
  }, [uid, isAuthenticated]);

  const setPref = (partial: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...partial };
      try {
        localStorage.setItem(`${PREFS_KEY}:${uid}`, JSON.stringify(next));
      } catch {
        /* */
      }
      return next;
    });
  };

  const markAllRead = () => {
    setFeed((prev) => {
      const next = prev.map((a) => ({ ...a, read: true }));
      saveFeed(uid, next);
      return next;
    });
  };

  return { prefs, feed, setPref, markAllRead };
}
