"use client";

import { ChevronDown } from "lucide-react";

import type { CountryIdDoc } from "@/lib/country-id-rules";

interface Tier2IdTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: CountryIdDoc[] | { kind: string; label: string }[];
  isLight?: boolean;
}

const DEFAULT_DOC_OPTIONS = [
  { kind: "national_id", label: "NIN" },
  { kind: "drivers_licence", label: "Driver’s licence" },
  { kind: "voters_card", label: "Voter’s card" },
  { kind: "passport", label: "International passport" },
];

export function Tier2IdTypeSelect({
  value,
  onChange,
  options = [],
}: Tier2IdTypeSelectProps) {
  const docList = options.length > 0 ? options : DEFAULT_DOC_OPTIONS;

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
          className="w-full appearance-none rounded-ona-ctl border border-ona-border bg-ona-field px-4 py-3.5 pr-10 text-[12px] font-normal text-ona-ink transition-colors focus:outline-none focus:border-ona-ink cursor-pointer"
        >
          {docList.map((doc) => (
            <option key={doc.kind} value={doc.kind}>
              {doc.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ona-muted"
        />
      </div>
    </div>
  );
}
