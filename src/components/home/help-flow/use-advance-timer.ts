"use client";

import { useEffect, useRef } from "react";

/** Single pending auto-advance timeout, cleared on unmount. */
export function useAdvanceTimer() {
  const advanceTimerRef = useRef<number | null>(null);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current != null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => () => clearAdvanceTimer(), []);

  return { advanceTimerRef, clearAdvanceTimer };
}
