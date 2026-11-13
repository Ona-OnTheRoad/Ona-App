"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Six-box one-time-code entry. Boxes are real inputs (one-time-code autofill on
 * the first, paste fills all, backspace walks back). `value` is the digit string.
 *
 * SMS auto-fill: iOS/Android keyboards suggest the code via `one-time-code`, and
 * Chrome (Android) fills it by itself through the WebOTP API when the SMS ends
 * with "@<this site> #<code>" (see buildOtpMessage on the server).
 */
export function OnaOtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  label = "Verification code",
  autoFocus,
  onComplete,
  submitOnComplete,
  autoRead = true,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
  autoFocus?: boolean;
  /** Called once each time all digits are filled (typed, pasted or auto-filled). */
  onComplete?: (code: string) => void;
  /** Submit the surrounding <form> as soon as the code is complete. */
  submitOnComplete?: boolean;
  /** Read the code from the incoming SMS (WebOTP). On by default. */
  autoRead?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const groupRef = useRef<HTMLDivElement>(null);
  const digits = value.replace(/\D/g, "").slice(0, length);

  // Always call the freshest callbacks from the long-lived effects below.
  const latest = useRef({ onChange, onComplete, submitOnComplete });
  latest.current = { onChange, onComplete, submitOnComplete };

  const lastCompleted = useRef("");
  useEffect(() => {
    if (digits.length < length) {
      lastCompleted.current = "";
      return;
    }
    if (disabled || lastCompleted.current === digits) return;
    lastCompleted.current = digits;
    latest.current.onComplete?.(digits);
    if (latest.current.submitOnComplete) {
      const form = groupRef.current?.closest("form");
      // Next tick so the parent has applied the new code before it submits.
      if (form) window.setTimeout(() => form.requestSubmit(), 60);
    }
  }, [digits, length, disabled]);

  useEffect(() => {
    if (!autoRead || disabled) return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;
    const abort = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: abort.signal,
      } as CredentialRequestOptions & { otp: { transport: string[] } })
      .then((cred) => {
        const code = (cred as { code?: string } | null)?.code;
        const clean = String(code || "").replace(/\D/g, "").slice(0, length);
        if (clean) latest.current.onChange(clean);
      })
      .catch(() => {
        /* dismissed, aborted or unsupported: typing still works */
      });
    return () => abort.abort();
  }, [autoRead, disabled, length]);

  const focusAt = (i: number) =>
    refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;
    const next = (digits.slice(0, i) + clean + digits.slice(i + 1)).slice(
      0,
      length,
    );
    onChange(next);
    focusAt(Math.min(i + clean.length, length - 1));
  };

  return (
    <div ref={groupRef} role="group" aria-label={label} className="flex gap-2">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digits[i] ?? ""}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${label}, digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (digits[i]) onChange(digits.slice(0, i) + digits.slice(i + 1));
              else if (i > 0) {
                onChange(digits.slice(0, i - 1) + digits.slice(i));
                focusAt(i - 1);
              }
            } else if (e.key === "ArrowLeft") focusAt(i - 1);
            else if (e.key === "ArrowRight") focusAt(i + 1);
          }}
          className={cn(
            "h-12 min-w-0 flex-1 rounded-ona-ctl border border-ona-border bg-ona-field text-center text-[20px] font-semibold text-ona-ink outline-none transition-colors focus:border-ona-ink disabled:opacity-60",
            invalid && "border-ona-danger",
          )}
        />
      ))}
    </div>
  );
}
