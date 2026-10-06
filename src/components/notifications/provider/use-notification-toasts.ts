"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppNotification } from "@/lib/notifications/types";
import { shouldToastNotification } from "@/lib/notifications/types";
import { shouldShowToast } from "@/lib/notifications/quiet-hours";
import {
  isNonStackNotification,
  TOAST_MAX_NON_STACK,
} from "@/lib/notifications/stack-rules";
import {
  TOAST_MAX_STACK,
  TOAST_VISIBLE_MS,
  canAutoShowToast,
} from "@/lib/notifications/toast-timing";
import { playAppSound } from "@/lib/sound-tone";
import { persistSeenNotifIds, readSeenNotifIds } from "./seen-ids";
import type { ToastItem } from "./types";

/** Toast queue: throttle, dedupe, stack limits, auto-dismiss tick. */
export function useNotificationToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  /** Start of current/last auto-toast wave (throttle + pile window). */
  const lastToastWaveAt = useRef(0);
  /** Avoid double-toast for same notification id. */
  const toastedIds = useRef<Set<string>>(readSeenNotifIds());
  /** Rows created long before the first toast moment are history never toast
   * them again on reload or role switch. Only live inserts toast, once.
   * (Lazily stamped on first use: Date.now() is not render-safe.) */
  const mountedAtRef = useRef(0);

  const pushToast = useCallback((n: AppNotification) => {
    if (!shouldToastNotification(n)) return;
    if (!shouldShowToast(n.priority)) return;
    // History is silent: a row created long before the first toast moment (or
    // with a missing/unparseable timestamp) must never toast on a reload or
    // role switch. 15s grace absorbs clock skew without letting old rows
    // resurface.
    if (mountedAtRef.current === 0) mountedAtRef.current = Date.now();
    const createdMs = n.createdAt ? Date.parse(n.createdAt) : NaN;
    if (
      !Number.isFinite(createdMs) ||
      createdMs < mountedAtRef.current - 15_000
    )
      return;
    // Never re-toast the same notification row
    if (toastedIds.current.has(n.id)) return;

    const now = Date.now();
    const nonStack = isNonStackNotification(n);

    // Chat / call / payment / accept always surface as full rows under the
    // pile never blocked by stack throttle.
    if (!nonStack) {
      const gate = canAutoShowToast(lastToastWaveAt.current, now);
      if (!gate.allow) {
        // Still land in center list no popup spam for stackable types
        return;
      }
      if (gate.reason === "new_wave") {
        lastToastWaveAt.current = now;
      }
    }

    toastedIds.current.add(n.id);
    void persistSeenNotifIds(toastedIds.current);
    const isMessage = n.category === "messages" || n.actionType === "open_chat";
    const id = `toast-${n.id}-${now}`;
    // Full-row (non-stack) timers are independent; stacked cards share wave end
    const expiresAt = nonStack
      ? now + TOAST_VISIBLE_MS
      : (lastToastWaveAt.current > 0 ? lastToastWaveAt.current : now) +
        TOAST_VISIBLE_MS;

    setToasts((prev) => {
      const next = [{ id, notification: n, expiresAt }, ...prev];
      const stack: typeof next = [];
      const full: typeof next = [];
      for (const t of next) {
        if (isNonStackNotification(t.notification)) full.push(t);
        else stack.push(t);
      }
      return [
        ...full.slice(0, TOAST_MAX_NON_STACK),
        ...stack.slice(0, TOAST_MAX_STACK),
      ];
    });
    if (isMessage) {
      playAppSound("success_soft");
    } else if (n.priority === "critical" || n.priority === "high") {
      playAppSound("request_new");
    } else {
      playAppSound("success_soft");
    }
  }, []);

  /** Re-seed from storage and clear the queue (session identity changed). */
  const resetToasts = () => {
    toastedIds.current = readSeenNotifIds();
    lastToastWaveAt.current = 0;
    setToasts([]);
  };

  // Auto-dismiss after 3s 1s tick is enough (was 250ms → needless React work)
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      setToasts((prev) => {
        const next = prev.filter((x) => x.expiresAt > now);
        return next.length === prev.length ? prev : next;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast, resetToasts };
}
