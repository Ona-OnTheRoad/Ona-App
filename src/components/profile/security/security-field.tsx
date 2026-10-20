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
  isLight,
  label,
  value,
  badge,
  onChangeClick,
  disabled,
}: SecurityFieldProps) {
  const t = profileTheme(isLight);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-slate-400 dark:text-white/50">
          {label}
        </p>
        <p className={cn("truncate text-[15px] font-bold mt-0.5", t.ink)}>
          {value}
        </p>
        {badge && (
          <p className="text-[11px] text-slate-400 dark:text-white/50 mt-0.5">
            {badge}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onChangeClick}
        disabled={disabled}
        className={cn(
          "shrink-0 rounded-xl border-0 px-4 py-1.5 text-[13px] font-semibold transition-all",
          disabled && "opacity-40",
          isLight
            ? "bg-[#F1F3F5] text-slate-900 hover:bg-slate-200"
            : "bg-[#2c2c2e] text-white hover:bg-[#38383a]",
        )}
      >
        Change
      </button>
    </div>
  );
}
