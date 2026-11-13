"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  placeholder,
  value,
  onChange,
  isLight,
  autoFocus,
  autoComplete,
  id,
  ariaLabel,
  ariaDescribedBy,
  ariaInvalid,
}: {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  isLight?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  /** Lets a <label for> or OnaField name this input. */
  id?: string;
  /** Accessible name when there is no visible <label> (a placeholder is not a name). */
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className={className}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1",
          isLight ? "text-slate-500" : "text-white/50",
        )}
        aria-label="Show password"
        aria-pressed={show}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
