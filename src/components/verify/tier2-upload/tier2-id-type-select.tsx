"use client";

import { ChevronDown } from "lucide-react";

interface Tier2IdTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  isLight?: boolean;
}

export function Tier2IdTypeSelect({
  value,
  onChange,
}: Tier2IdTypeSelectProps) {
  return (
    <div>
      <label
        htmlFor="verify-id-type"
        className="block text-[12px] font-medium mb-1.5 text-ona-ink"
      >
        ID type
      </label>
      <div className="relative">
        <select
          id="verify-id-type"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-ona-ctl border border-ona-border bg-ona-field px-4 py-3.5 pr-10 text-[12px] font-normal text-ona-ink transition-colors focus:outline-none focus:border-ona-ink"
        >
          <option value="national_id">NIN</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ona-muted"
        />
      </div>
    </div>
  );
}
