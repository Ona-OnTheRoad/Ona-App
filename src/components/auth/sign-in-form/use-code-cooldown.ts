"use client";

import { useEffect, useState } from "react";
import { COOLDOWN_SEC, FAIL_THRESHOLD } from "./helpers";

/** Cooldown and failed attempt tracking for phone code entry. */
export function useCodeCooldown() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const inCooldown = cooldownLeft > 0;

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) setCooldownUntil(0);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  function startCooldown(sec = COOLDOWN_SEC) {
    setCooldownUntil(Date.now() + sec * 1000);
    setCooldownLeft(sec);
  }

  function resetCooldown() {
    setFailedAttempts(0);
    setCooldownUntil(0);
    setCooldownLeft(0);
  }

  function registerFailure(): number {
    const nextFails = failedAttempts + 1;
    setFailedAttempts(nextFails);
    if (nextFails >= FAIL_THRESHOLD) {
      startCooldown(COOLDOWN_SEC);
    }
    return nextFails;
  }

  return {
    failedAttempts,
    inCooldown,
    cooldownLeft,
    startCooldown,
    resetCooldown,
    registerFailure,
  };
}
