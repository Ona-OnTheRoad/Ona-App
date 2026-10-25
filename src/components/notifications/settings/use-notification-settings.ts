"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuietHoursConfig } from "@/lib/notifications/quiet-hours";
import { authFetch } from "@/lib/api-auth-headers";
import {
  DEFAULT_SETTINGS,
  parseNotificationSettings,
  readSettings,
  writeSettings,
} from "./storage";
import type {
  NotificationCategoryPref,
  NotificationDeliveryPref,
  NotificationSettingsState,
} from "./types";

export function useNotificationSettings(
  userKey: string,
  onSaved?: (state: NotificationSettingsState) => void,
) {
  const [state, setState] = useState<NotificationSettingsState>(() =>
    readSettings(userKey),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const latestStateRef = useRef<NotificationSettingsState>(state);
  latestStateRef.current = state;
  const saveTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Initial hydration from fast local cache
    const initial = readSettings(userKey);
    setState(initial);
    latestStateRef.current = initial;
    setDirty(false);

    // 2. Fetch server preferences if user is authenticated
    let active = true;
    if (userKey && userKey !== "guest") {
      authFetch("/api/notifications/settings", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!active || !json?.ok || !json.data) return;
          const remotePref = json.data as Record<string, unknown>;
          if (remotePref && Object.keys(remotePref).length > 0) {
            const parsedRemote = parseNotificationSettings(remotePref);
            setState(parsedRemote);
            latestStateRef.current = parsedRemote;
            writeSettings(userKey, parsedRemote);
            setDirty(false);
          }
        })
        .catch(() => {
          /* offline or unauthenticated fallback */
        });
    }

    return () => {
      active = false;
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [userKey]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const syncToServer = useCallback(
    async (nextState: NotificationSettingsState) => {
      if (!userKey || userKey === "guest") {
        setDirty(false);
        return;
      }
      setSaving(true);
      try {
        const res = await authFetch("/api/notifications/settings", {
          method: "PATCH",
          body: JSON.stringify(nextState),
        });
        if (!res.ok) {
          throw new Error("Server rejected preferences update");
        }
        setDirty(false);
        onSaved?.(nextState);
      } catch {
        /* will sync on next server connect */
        setDirty(false);
      } finally {
        setSaving(false);
      }
    },
    [userKey, onSaved],
  );

  const persistAndSync = useCallback(
    (nextState: NotificationSettingsState) => {
      setState(nextState);
      latestStateRef.current = nextState;
      writeSettings(userKey, nextState);
      setDirty(true);

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        void syncToServer(nextState);
      }, 500);
    },
    [userKey, syncToServer],
  );

  const patch = useCallback(
    (partial: Partial<NotificationSettingsState>) => {
      const next = { ...latestStateRef.current, ...partial };
      persistAndSync(next);
    },
    [persistAndSync],
  );

  const patchCategory = useCallback(
    (key: keyof NotificationCategoryPref, value: boolean) => {
      const next: NotificationSettingsState = {
        ...latestStateRef.current,
        categories: { ...latestStateRef.current.categories, [key]: value },
      };
      persistAndSync(next);
    },
    [persistAndSync],
  );

  const patchDelivery = useCallback(
    (key: keyof NotificationDeliveryPref, value: boolean) => {
      const next: NotificationSettingsState = {
        ...latestStateRef.current,
        delivery: { ...latestStateRef.current.delivery, [key]: value },
      };
      persistAndSync(next);
    },
    [persistAndSync],
  );

  const patchQuiet = useCallback(
    (partial: Partial<QuietHoursConfig>) => {
      const next: NotificationSettingsState = {
        ...latestStateRef.current,
        quietHours: { ...latestStateRef.current.quietHours, ...partial },
      };
      persistAndSync(next);
    },
    [persistAndSync],
  );

  const handleSave = async () => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    writeSettings(userKey, latestStateRef.current);
    showToast("All preferences saved");
    await syncToServer(latestStateRef.current);
    setDirty(false);
  };

  return {
    state,
    dirty,
    saving,
    toast,
    patch,
    patchCategory,
    patchDelivery,
    patchQuiet,
    handleSave,
  };
}
