"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  autoComplete?: string;
}

export function PasswordInputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "off",
}: PasswordInputFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[14px] font-medium text-ona-ink"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 pr-11 text-[12px] font-normal text-ona-ink outline-none transition-colors placeholder:text-ona-muted/60 focus:border-ona-ink"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-ona-muted hover:text-ona-ink transition-colors cursor-pointer"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="h-5 w-5" strokeWidth={2} />
          ) : (
            <Eye className="h-5 w-5" strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}
