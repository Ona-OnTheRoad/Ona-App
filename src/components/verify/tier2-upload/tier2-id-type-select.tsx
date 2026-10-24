"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CountryIdDoc } from "@/lib/country-id-rules";

interface Tier2IdTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: CountryIdDoc[] | { kind: string; label: string }[];
  isLight?: boolean;
}

const DEFAULT_DOC_OPTIONS = [
  { kind: "national_id", label: "National Identification Number (NIN)", shortLabel: "NIN" },
  { kind: "bvn", label: "Bank Verification Number (BVN)", shortLabel: "BVN" },
  { kind: "drivers_licence", label: "Drivers license", shortLabel: "Drivers license" },
  { kind: "passport", label: "Passport", shortLabel: "Passport" },
];

export function Tier2IdTypeSelect({
  value,
  onChange,
  options = [],
}: Tier2IdTypeSelectProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedKind, setSelectedKind] = useState(value || "national_id");

  const docList = options.length > 0
    ? options.map((d) => ({
        kind: d.kind,
        label: d.label,
        shortLabel: d.kind === "national_id" ? "NIN" : d.label,
      }))
    : DEFAULT_DOC_OPTIONS;

  const currentDoc = docList.find((d) => d.kind === value) || docList[0];

  const handleConfirm = () => {
    onChange(selectedKind);
    setSheetOpen(false);
  };

  return (
    <div>
      <label
        htmlFor="verify-id-type"
        className="block text-[12px] font-medium mb-1.5 text-ona-ink"
      >
        ID type
      </label>

      {/* Accessible native select for accessibility & form semantics */}
      <select
        id="verify-id-type"
        aria-label="ID type"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      >
        {docList.map((doc) => (
          <option key={doc.kind} value={doc.kind}>
            {doc.label}
          </option>
        ))}
      </select>

      {/* Select button triggering bottom sheet */}
      <button
        type="button"
        id="verify-id-type-btn"
        aria-haspopup="dialog"
        onClick={() => {
          setSelectedKind(value || "national_id");
          setSheetOpen(true);
        }}
        className="flex w-full items-center justify-between rounded-ona-ctl border border-ona-border bg-ona-field px-4 py-3.5 text-left text-[13px] font-normal text-ona-ink transition-colors hover:border-ona-ink cursor-pointer"
      >
        <span>{currentDoc?.shortLabel || "Select ID type"}</span>
        <ChevronDown className="h-4.5 w-4.5 text-ona-muted" />
      </button>

      {/* Bottom Sheet Backdrop & Modal */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative z-10 w-full max-w-lg mx-auto rounded-t-[28px] border-t border-ona-border bg-ona-surface p-5 pb-8 shadow-2xl transition-all animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ona-muted/30" />

            {/* Sheet Title */}
            <h3 className="text-[17px] font-bold text-ona-ink mb-4">
              Select ID type
            </h3>

            {/* Radio Options */}
            <div className="divide-y divide-ona-border border-y border-ona-border">
              {docList.map((doc) => {
                const isSelected = selectedKind === doc.kind;
                return (
                  <button
                    key={doc.kind}
                    type="button"
                    onClick={() => setSelectedKind(doc.kind)}
                    className="flex w-full items-center justify-between py-3.5 text-left transition-colors hover:bg-black/2 dark:hover:bg-white/2 cursor-pointer"
                  >
                    <span className="text-[14px] font-medium text-ona-ink">
                      {doc.label}
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? "border-brand"
                          : "border-ona-border bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={handleConfirm}
              className="mt-6 w-full rounded-ona-ctl bg-brand hover:opacity-90 py-3.5 text-[14px] font-bold text-white transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
