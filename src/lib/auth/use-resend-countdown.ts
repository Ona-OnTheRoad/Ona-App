"use client";

import { useCallback, useEffect, useState } from "react";

/** Matches the server's minimum gap between two codes (POST /api/auth/otp/send). */
export const OTP_RESEND_SECONDS = 30;

/**
 * Whole seconds left before "Resend code" may be used again. Start it after each
 * successful send so users never hit the server's cooldown error.
 */
export function useResendCountdown() {
  const [until, setUntil] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!until) {
      setLeft(0);
      return;
    }
    const tick = () => {
      const s = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) setUntil(0);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [until]);

  const start = useCallback((seconds: number = OTP_RESEND_SECONDS) => {
    setUntil(Date.now() + seconds * 1000);
    setLeft(seconds);
  }, []);
  const reset = useCallback(() => {
    setUntil(0);
    setLeft(0);
  }, []);

  return { left, start, reset };
}
