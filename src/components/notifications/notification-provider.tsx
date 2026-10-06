"use client";

/**
 * Notification context list, unread, toasts, center open state.
 * Loads API + samples; Supabase Realtime for live inserts.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppNotification,
  NotificationFilter,
} from "@/lib/notifications/types";
import { shouldListNotification } from "@/lib/notifications/types";
import { useApp } from "@/lib/store";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mapRow } from "./provider/map-row";
import { redirectToReleasePayIfNeeded } from "./provider/release-pay-redirect";
import { persistSeenNotifIds, readSeenNotifIds } from "./provider/seen-ids";
import type { Ctx, ToastItem } from "./provider/types";
import { useNotificationToasts } from "./provider/use-notification-toasts";

export type { ToastItem };

const NotificationContext = createContext<Ctx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { backendUserId, accountType, isAuthenticated } = useApp();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");
  const primed = useRef(false);
  const knownIds = useRef<Set<string>>(readSeenNotifIds());
  const { toasts, pushToast, dismissToast, resetToasts } =
    useNotificationToasts();

  const role = accountType === "professional" ? "professional" : "motorist";

  const refresh = useCallback(async () => {
    if (!backendUserId || !isAuthenticated) {
      setNotifications([]);
      return;
    }
    // Only show loading on first prime avoids list flicker on poll/realtime
    if (!primed.current) setLoading(true);
    try {
      const { authFetch } = await import("@/lib/api-auth-headers");
      const res = await authFetch(
        `/api/notifications?userId=${encodeURIComponent(backendUserId)}`,
        { cache: "default" },
      );
      const json = await res.json();
      if (json?.ok && Array.isArray(json.data?.notifications)) {
        const list = json.data.notifications as AppNotification[];
        const surface = list.filter(shouldListNotification);
        setNotifications(surface);
        if (!primed.current) {
          knownIds.current = new Set([
            ...readSeenNotifIds(),
            ...list.map((n) => n.id),
          ]);
          void persistSeenNotifIds(knownIds.current);
          primed.current = true;
        }
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [backendUserId, isAuthenticated, role]);

  useEffect(() => {
    primed.current = false;
    // Re-seed from storage first so a role flip can never re-toast rows this
    // browser already saw (Realtime replays missed inserts into fresh sets).
    knownIds.current = readSeenNotifIds();
    resetToasts();
    void refresh();
    // Depend on session identity only not `refresh` fn identity (avoids fetch storms)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUserId, isAuthenticated, role]);

  // Poll backup every 10 min when visible (Realtime is primary data saver)
  useEffect(() => {
    if (!backendUserId || !isAuthenticated) return;
    const t = window.setInterval(() => {
      if (document.hidden) return;
      void refresh();
    }, 600_000);
    return () => window.clearInterval(t);
  }, [backendUserId, isAuthenticated, refresh]);

  // Realtime inserts
  useEffect(() => {
    if (!backendUserId || !isAuthenticated) return;
    let sb: ReturnType<typeof createBrowserSupabase> | null = null;
    try {
      sb = createBrowserSupabase();
    } catch {
      return;
    }
    if (!sb) return;
    const channel = sb
      .channel(
        `om-notif-${backendUserId}-${Math.random().toString(36).slice(2, 8)}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${backendUserId}`,
        },
        (payload: { new?: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row?.id) return;
          const n = mapRow(row);
          if (knownIds.current.has(n.id)) return;
          knownIds.current.add(n.id);
          void persistSeenNotifIds(knownIds.current);
          if (shouldListNotification(n)) {
            setNotifications((prev) => [n, ...prev]);
          }
          pushToast(n);
          redirectToReleasePayIfNeeded(n);
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [backendUserId, isAuthenticated, pushToast]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setNotifications((prev) =>
        prev.map((n) =>
          ids.includes(n.id)
            ? { ...n, readAt: n.readAt || new Date().toISOString() }
            : n,
        ),
      );
      if (!backendUserId) return;
      if (ids.every((id) => id.startsWith("local-"))) return;
      const { authFetch } = await import("@/lib/api-auth-headers");
      await authFetch("/api/notifications/read", {
        method: "POST",
        body: JSON.stringify({ userId: backendUserId, ids }),
      }).catch(() => null);
    },
    [backendUserId],
  );

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || now })),
    );
    if (!backendUserId) return;
    const { authFetch } = await import("@/lib/api-auth-headers");
    await authFetch("/api/notifications/read-all", {
      method: "POST",
      body: JSON.stringify({ userId: backendUserId }),
    }).catch(() => null);
  }, [backendUserId]);

  const pushLocal = useCallback(
    (
      partial: Omit<AppNotification, "id" | "userId" | "createdAt"> & {
        id?: string;
        createdAt?: string;
      },
    ) => {
      const n: AppNotification = {
        id: partial.id || `local-${Date.now()}`,
        userId: backendUserId || "local",
        createdAt: partial.createdAt || new Date().toISOString(),
        category: partial.category,
        priority: partial.priority,
        title: partial.title,
        body: partial.body,
        href: partial.href,
        actionType: partial.actionType,
        actionPayload: partial.actionPayload,
        groupKey: partial.groupKey,
        jobId: partial.jobId,
        jobStatus: partial.jobStatus,
        messageText: partial.messageText,
        readAt: partial.readAt,
      };
      if (shouldListNotification(n)) {
        setNotifications((prev) => [n, ...prev]);
      }
      knownIds.current.add(n.id);
      pushToast(n);
    },
    [backendUserId, pushToast],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    let list = notifications;
    if (filter !== "all") {
      list = list.filter((n) => n.category === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          (n.messageText || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [notifications, filter, search]);

  const value = useMemo<Ctx>(
    () => ({
      notifications,
      unreadCount,
      loading,
      centerOpen,
      openCenter: () => setCenterOpen(true),
      closeCenter: () => setCenterOpen(false),
      filter,
      setFilter,
      search,
      setSearch,
      toasts,
      dismissToast,
      markRead,
      markAllRead,
      refresh,
      filtered,
      pushLocal,
    }),
    [
      notifications,
      unreadCount,
      loading,
      centerOpen,
      filter,
      search,
      toasts,
      dismissToast,
      markRead,
      markAllRead,
      refresh,
      filtered,
      pushLocal,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): Ctx {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return ctx;
}

export function useNotificationsOptional(): Ctx | null {
  return useContext(NotificationContext);
}
