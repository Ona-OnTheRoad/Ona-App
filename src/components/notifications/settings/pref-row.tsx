"use client";

import { OnaToggle } from "@/components/ui/ona-toggle";

interface PrefRowProps {
  label: string;
  detail: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (val: boolean) => void;
}

export function PrefRow({
  label,
  detail,
  checked,
  disabled = false,
  onChange,
}: PrefRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 first:pt-2.5 last:pb-1">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-[12px] font-medium text-ona-ink">{label}</p>
        <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
          {detail}
        </p>
      </div>
      <OnaToggle
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        label={label}
      />
    </div>
  );
}
