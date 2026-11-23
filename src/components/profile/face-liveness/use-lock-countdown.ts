import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatClock } from "@/lib/format-wait";
import type { LivenessPhase } from "./types";

/**
 * Live countdown for a liveness lock (local lockout or the server's
 * Retry-After). `setLockMs` starts it; while `phase` is "locked" it ticks
 * every second and calls `onExpire` when the wait is over.
 */
export function useLockCountdown(phase: LivenessPhase, onExpire: () => void) {
  const [lockMs, setLockMsState] = useState(0);
  const lockEndsRef = useRef(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const setLockMs = useCallback((ms: number) => {
    lockEndsRef.current = ms > 0 ? Date.now() + ms : 0;
    setLockMsState(Math.max(0, ms));
  }, []);

  useEffect(() => {
    if (phase !== "locked" || !lockEndsRef.current) return;
    const id = window.setInterval(() => {
      const left = lockEndsRef.current - Date.now();
      if (left > 0) return setLockMsState(left);
      window.clearInterval(id);
      lockEndsRef.current = 0;
      setLockMsState(0);
      onExpireRef.current();
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  /** "45s", "25m 02s": seconds under a minute. */
  const lockLabel = useMemo(
    () => (lockMs > 0 ? formatClock(Math.ceil(lockMs / 1000)) : ""),
    [lockMs],
  );

  return { lockMs, setLockMs, lockLabel };
}
