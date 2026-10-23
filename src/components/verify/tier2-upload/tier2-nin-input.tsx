"use client";

import type { CountryIdDoc } from "@/lib/country-id-rules";
import { filterIdInput } from "@/lib/country-id-rules";

interface Tier2NinInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedDoc?: CountryIdDoc;
  isLight?: boolean;
}

export function Tier2NinInput({
  value,
  onChange,
  selectedDoc,
}: Tier2NinInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedDoc) {
      onChange(filterIdInput(e.target.value, selectedDoc));
    } else {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
      onChange(digits);
    }
  };

  const labelText = selectedDoc ? `${selectedDoc.label} number` : "NIN number";
  const placeholderText = selectedDoc
    ? selectedDoc.placeholder
      ? `Enter your ${selectedDoc.placeholder}`
      : `Enter your ${selectedDoc.label}`
    : "Enter your 11-digit NIN";
  const hintText = selectedDoc
    ? selectedDoc.kind === "national_id" || selectedDoc.api === "nin"
      ? "Dial *346# on the phone number you used for NIN registration."
      : selectedDoc.hint
    : "Dial *346# on the phone number you used for NIN registration.";

  return (
    <div>
      <label
        htmlFor="verify-id-number"
        className="block text-[12px] font-medium mb-1.5 text-ona-ink"
      >
        {labelText}
      </label>
      <input
        id="verify-id-number"
        value={value}
        onChange={handleChange}
        placeholder={placeholderText}
        maxLength={selectedDoc?.maxLen ?? 11}
        inputMode={selectedDoc?.charset === "digits" ? "numeric" : "text"}
        className="w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 py-3.5 text-[12px] font-normal text-ona-ink placeholder:text-ona-muted transition-colors focus:outline-none focus:border-ona-ink"
      />
      {hintText ? (
        <p className="text-[12px] mt-2 leading-snug text-ona-muted">
          {hintText}
        </p>
      ) : null}
    </div>
  );
}
