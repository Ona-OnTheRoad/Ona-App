"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuietHoursConfig } from "@/lib/notifications/quiet-hours";
import { getAppSupabase } from "@/lib/supabase/app-client";
import { DEFAULT_SETTINGS, readSettings, writeSettings } from "./storage";
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
    setState(readSettings(userKey));
    setDirty(false);
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

      const sb = getAppSupabase();
      const { data: sessionData } = await sb!.auth.getSession();
      const token = sessionData.session?.access_token;
      await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, ...state }),
      });

      setDirty(false);
      onSaved?.(state);
      showToast("Notification preferences saved");
    } catch {
      showToast("Could not save. Try again.");
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
