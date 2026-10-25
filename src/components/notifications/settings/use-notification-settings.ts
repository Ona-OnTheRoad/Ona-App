"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuietHoursConfig } from "@/lib/notifications/quiet-hours";
import { authFetch } from "@/lib/api-auth-headers";
import {
  DEFAULT_SETTINGS,
  hasPendingSync,
  parseNotificationSettings,
  readSettings,
  setPendingSync,
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
  const [dirty, setDirty] = useState(() => hasPendingSync(userKey));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const latestStateRef = useRef<NotificationSettingsState>(state);
  latestStateRef.current = state;
  const dirtyRef = useRef<boolean>(dirty);
  dirtyRef.current = dirty;
  const userEditedRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  const syncToServer = useCallback(
    async (nextState: NotificationSettingsState): Promise<boolean> => {
      if (!userKey || userKey === "guest") {
        setDirty(false);
        dirtyRef.current = false;
        setPendingSync(userKey, false);
        return true;
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
        dirtyRef.current = false;
        setPendingSync(userKey, false);
        onSaved?.(nextState);
        return true;
      } catch {
        // Retain dirty state and mark pending sync so it can be retried on reconnect
        setDirty(true);
        dirtyRef.current = true;
        setPendingSync(userKey, true);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userKey, onSaved],
  );

  useEffect(() => {
    // 1. Initial hydration from fast local cache
    userEditedRef.current = false;
    const initial = readSettings(userKey);
    setState(initial);
    latestStateRef.current = initial;

    const isPending = hasPendingSync(userKey);
    setDirty(isPending);
    dirtyRef.current = isPending;

    // 2. Fetch server preferences if user is authenticated
    let active = true;
    if (userKey && userKey !== "guest") {
      // If user had unsynced changes from an earlier offline session, sync them to server
      if (isPending) {
        void syncToServer(initial);
      } else {
        Promise.resolve(
          authFetch("/api/notifications/settings", { cache: "no-store" }),
        )
          .then((res) => (res && res.ok ? res.json() : null))
          .then((json) => {
            if (!active || !json?.ok || !json.data) return;
            // Guard: If user has already made changes while fetch was in flight, do not overwrite!
            if (userEditedRef.current || dirtyRef.current) {
              void syncToServer(latestStateRef.current);
              return;
            }
            const remotePref = json.data as Record<string, unknown>;
            if (remotePref && Object.keys(remotePref).length > 0) {
              const parsedRemote = parseNotificationSettings(remotePref);
              setState(parsedRemote);
              latestStateRef.current = parsedRemote;
              writeSettings(userKey, parsedRemote);
              setDirty(false);
              dirtyRef.current = false;
              setPendingSync(userKey, false);
            }
          })
          .catch(() => {
            /* offline or unauthenticated fallback */
          });
      }
    }

    return () => {
      active = false;
      // When leaving within 500ms debounce window: flush in-flight save immediately with keepalive
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        if (userKey && userKey !== "guest") {
          Promise.resolve(
            authFetch("/api/notifications/settings", {
              method: "PATCH",
              keepalive: true,
              body: JSON.stringify(latestStateRef.current),
            }),
          )
            .then((res) => {
              if (res && res.ok) {
                setPendingSync(userKey, false);
              } else {
                setPendingSync(userKey, true);
              }
            })
            .catch(() => {
              setPendingSync(userKey, true);
            });
        }
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [userKey, syncToServer]);

  // Reconnection listener: retry pending sync when device comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (hasPendingSync(userKey) || dirtyRef.current) {
        void syncToServer(latestStateRef.current);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [userKey, syncToServer]);

  const persistAndSync = useCallback(
    (nextState: NotificationSettingsState) => {
      userEditedRef.current = true;
      setState(nextState);
      latestStateRef.current = nextState;
      writeSettings(userKey, nextState);
      setDirty(true);
      dirtyRef.current = true;
      setPendingSync(userKey, true);

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        saveTimeoutRef.current = null;
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
      saveTimeoutRef.current = null;
    }
    writeSettings(userKey, latestStateRef.current);
    const success = await syncToServer(latestStateRef.current);
    if (success) {
      showToast("All preferences saved");
    } else {
      showToast("Saved on device. Will sync to server when connected.");
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
