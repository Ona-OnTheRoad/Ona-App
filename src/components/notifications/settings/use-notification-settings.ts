"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [state, setState] =
    useState<NotificationSettingsState>(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial hydration from fast local cache
    setState(readSettings(userKey));
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
            writeSettings(userKey, parsedRemote);
          }
        })
        .catch(() => {
          /* offline or unauthenticated fallback */
        });
    }

    return () => {
      active = false;
    };
  }, [userKey]);

  const patch = useCallback((partial: Partial<NotificationSettingsState>) => {
    setState((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  }, []);

  const patchCategory = useCallback(
    (key: keyof NotificationCategoryPref, value: boolean) => {
      setState((prev) => ({
        ...prev,
        categories: { ...prev.categories, [key]: value },
      }));
      setDirty(true);
    },
    [],
  );

  const patchDelivery = useCallback(
    (key: keyof NotificationDeliveryPref, value: boolean) => {
      setState((prev) => ({
        ...prev,
        delivery: { ...prev.delivery, [key]: value },
      }));
      setDirty(true);
    },
    [],
  );

  const patchQuiet = useCallback((partial: Partial<QuietHoursConfig>) => {
    setState((prev) => ({
      ...prev,
      quietHours: { ...prev.quietHours, ...partial },
    }));
    setDirty(true);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      writeSettings(userKey, state);

      const res = await authFetch("/api/notifications/settings", {
        method: "PATCH",
        body: JSON.stringify(state),
      });

      if (!res.ok) {
        throw new Error("Server rejected preferences update");
      }

      setDirty(false);
      onSaved?.(state);
      showToast("Notification preferences saved");
    } catch {
      showToast("Saved on device. Will sync to server when connected.");
    } finally {
      setSaving(false);
    }
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
