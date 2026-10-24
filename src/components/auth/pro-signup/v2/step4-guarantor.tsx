"use client";

import { SheetSelect } from "@/components/ui/option-sheet";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Step4GuarantorProps {
  guarantorName: string;
  setGuarantorName: (val: string) => void;
  guarantorPhone: string;
  setGuarantorPhone: (val: string) => void;
  guarantorOccupation: string;
  setGuarantorOccupation: (val: string) => void;
  guarantorAddress: string;
  setGuarantorAddress: (val: string) => void;
  guarantorRelationship: string;
  setGuarantorRelationship: (val: string) => void;
  onContinue: () => void;
}

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Uncle",
  "Aunt",
  "Spouse",
  "Former Employer",
  "Senior Colleague",
  "Pastor / Clergy",
  "Community Leader",
  "Friend",
];

export function Step4Guarantor({
  guarantorName,
  setGuarantorName,
  guarantorPhone,
  setGuarantorPhone,
  guarantorOccupation,
  setGuarantorOccupation,
  guarantorAddress,
  setGuarantorAddress,
  guarantorRelationship,
  setGuarantorRelationship,
  onContinue,
}: Step4GuarantorProps) {
  // Split initial name if existing
  const [firstName, setFirstName] = useState(() => {
    const parts = guarantorName.trim().split(" ");
    return parts[0] || "";
  });
  const [lastName, setLastName] = useState(() => {
    const parts = guarantorName.trim().split(" ");
    return parts.slice(1).join(" ") || "";
  });

  useEffect(() => {
    const full = `${firstName.trim()} ${lastName.trim()}`.trim();
    setGuarantorName(full);
  }, [firstName, lastName, setGuarantorName]);

  const cleanPhone = guarantorPhone.replace(/\D/g, "");
  const isValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    cleanPhone.length >= 7 &&
    guarantorRelationship.trim().length >= 2;

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-ona-bg text-ona-ink">
      {/* Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ona-ink tracking-tight">
          Guarantor
        </h1>
        <p className="mt-1 text-xs text-ona-muted">
          Provide a guarantor reference. Must be at least name, phone, and your
          relationship.
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ona-ink">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Sarah"
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ona-ink">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Jenkins"
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
            />
          </div>
        </div>

        {/* Phone number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Phone number
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-ona-border bg-ona-field text-xs font-semibold text-ona-ink shrink-0">
              <span>🇳🇬</span>
              <span>+234</span>
              <ChevronDown className="w-3.5 h-3.5 text-ona-muted" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={guarantorPhone}
              onChange={(e) =>
                setGuarantorPhone(
                  e.target.value.replace(/\D/g, "").slice(0, 11),
                )
              }
              placeholder="Enter phone number"
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
            />
          </div>
        </div>

        {/* Occupation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Occupation
          </label>
          <input
            type="text"
            value={guarantorOccupation}
            onChange={(e) => setGuarantorOccupation(e.target.value)}
            placeholder="e.g. Business Owner"
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
          />
        </div>

        {/* Residential address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Residential address
          </label>
          <input
            type="text"
            value={guarantorAddress}
            onChange={(e) => setGuarantorAddress(e.target.value)}
            placeholder="e.g. 25 Awolowo Road, Ikeja"
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
          />
        </div>

        {/* Relationship */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Relationship to you
          </label>
          <SheetSelect
            bare
            title="Relationship to you"
            value={guarantorRelationship}
            onChange={(v) => setGuarantorRelationship(v)}
            placeholder="Select relationship"
            options={RELATIONSHIPS.map((r) => ({ value: String(r), label: r }))}
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink font-medium outline-none focus:outline-none"
            chevronClassName="right-3.5 text-ona-muted"
          />
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
            isValid
              ? "bg-brand hover:opacity-90 text-white active:scale-[0.99]"
              : "bg-brand/50 text-white cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
