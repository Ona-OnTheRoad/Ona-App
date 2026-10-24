"use client";

import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";

interface SecurityFieldProps {
  isLight: boolean;
  label: string;
  value: string;
  badge?: string;
  onChangeClick: () => void;
  disabled?: boolean;
}

export function SecurityField({
  label,
  value,
  badge,
  onChangeClick,
  disabled,
}: SecurityFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-ona-muted">
          {label}
        </p>
        <p className="truncate text-[15px] font-bold text-ona-ink mt-0.5">
          {value}
        </p>
        {badge && (
          <p className="text-[11px] text-ona-muted mt-0.5">
            {badge}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onChangeClick}
        disabled={disabled}
        className={cn(
          "shrink-0 rounded-ona-ctl border border-ona-border bg-ona-field px-4 py-1.5 text-[13px] font-semibold text-ona-ink transition-all hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer",
          disabled && "opacity-40 cursor-not-allowed",
        )}
      >
        Change
      </button>
    </div>
  );
}
