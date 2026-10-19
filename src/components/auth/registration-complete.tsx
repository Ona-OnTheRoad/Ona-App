"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playAppSound, unlockAudio } from "@/lib/sound-tone";
import { cn } from "@/lib/utils";

/** Success dialog Continue or auto-dismiss after 3s → dashboard */
export function RegistrationComplete({
  open,
  accountLabel,
  onContinue,
  autoContinueMs = 3000,
}: {
  open: boolean;
  accountLabel: string;
  onContinue: () => void;
  /** Auto-dismiss and continue if user does not tap (default 3s) */
  autoContinueMs?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  const handleContinue = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setExiting(true);
    setVisible(false);
    window.setTimeout(() => {
      setExiting(false);
      onContinueRef.current();
    }, 220);
  }, []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      setExiting(false);
      doneRef.current = false;
      return;
    }
    doneRef.current = false;
    unlockAudio();
    playAppSound("signup_complete");
    const t = window.requestAnimationFrame(() => setVisible(true));
    const auto = window.setTimeout(() => {
      handleContinue();
    }, autoContinueMs);
    return () => {
      window.cancelAnimationFrame(t);
      window.clearTimeout(auto);
    };
  }, [open, autoContinueMs, handleContinue]);

  const show = open || exiting;
  if (!show) return null;

  return (
    <div
      className={cn(
        "ona2 absolute inset-0 z-[400] flex items-center justify-center bg-transparent px-6 transition-opacity duration-200 ease-out",
        visible && !exiting ? "opacity-100" : "opacity-0",
      )}
      role="dialog"
      aria-modal
      aria-labelledby="reg-complete-title"
    >
      <div aria-hidden className="absolute inset-0 bg-ona-overlay" />
      <div
        className={cn(
          "relative w-full max-w-[300px] rounded-ona-sheet bg-ona-surface p-6 text-center shadow-[0_8px_30px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out",
          visible && !exiting
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-95 opacity-0",
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ona-success-soft">
          <CheckCircle2
            aria-hidden
            className="h-7 w-7 text-ona-success"
            strokeWidth={2}
          />
        </div>
        <h2
          id="reg-complete-title"
          className="mt-3 text-[18px] font-bold text-ona-ink"
        >
          You&apos;re all set
        </h2>
        <p className="mt-1 text-[13px] leading-snug text-ona-muted">
          Your {accountLabel} account is ready. You can start using Ona now.
        </p>
        <Button
          size="ona"
          variant="ona"
          onClick={handleContinue}
          className="mt-5"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
