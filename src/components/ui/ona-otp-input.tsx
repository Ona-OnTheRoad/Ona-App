"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Six-box one-time-code entry. Boxes are real inputs (one-time-code autofill on
 * the first, paste fills all, backspace walks back). `value` is the digit string.
 */
export function OnaOtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  label = "Verification code",
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.replace(/\D/g, "").slice(0, length);

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
    <div role="group" aria-label={label} className="flex gap-2">
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
