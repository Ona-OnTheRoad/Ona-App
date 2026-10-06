"use client";

import { useEffect, useRef, useState } from "react";
import type { AppNotification } from "@/lib/notifications/types";

/** Hold-to-read: a deliberate 1.5s hover marks an unread row read. */
export function useHoldToRead(markRead: (ids: string[]) => Promise<void>) {
  /** Deliberate-hover timers: id → timeout that will mark the row read */
  const hoverTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  /** Row currently in its 1.5s hold window (drives the pulse cue) */
  const [hoverHoldId, setHoverHoldId] = useState<string | null>(null);
  useEffect(
    () => () => {
      for (const t of hoverTimers.current.values()) clearTimeout(t);
      hoverTimers.current.clear();
    },
    [],
  );

  const onEnter = (n: AppNotification, unread: boolean) => {
    if (unread) {
      setHoverHoldId(n.id);
      const t = setTimeout(() => {
        void markRead([n.id]);
        hoverTimers.current.delete(n.id);
        setHoverHoldId(null);
      }, 1500);
      hoverTimers.current.set(n.id, t);
    }
  };

  const onLeave = (n: AppNotification) => {
    const t = hoverTimers.current.get(n.id);
    if (t) {
      clearTimeout(t);
      hoverTimers.current.delete(n.id);
    }
    setHoverHoldId(null);
  };

  return { hoverHoldId, onEnter, onLeave };
}
