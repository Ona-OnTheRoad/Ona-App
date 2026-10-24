"use client";

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
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-white dark:bg-[#121316]">
      {/* Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Guarantor
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Provide a guarantor reference. Must be at least name, phone, and your
          relationship.
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Sarah"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Jenkins"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Phone number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Phone number
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
              <span>🇳🇬</span>
              <span>+234</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={guarantorPhone}
              onChange={(e) =>
                setGuarantorPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder="Enter phone number"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Occupation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Occupation
          </label>
          <input
            type="text"
            value={guarantorOccupation}
            onChange={(e) => setGuarantorOccupation(e.target.value)}
            placeholder="e.g. Business Owner"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
          />
        </div>

        {/* Residential address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Residential address
          </label>
          <input
            type="text"
            value={guarantorAddress}
            onChange={(e) => setGuarantorAddress(e.target.value)}
            placeholder="e.g. 25 Awolowo Road, Ikeja"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
          />
        </div>

        {/* Relationship */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Relationship to you
          </label>
          <div className="relative">
            <select
              value={guarantorRelationship}
              onChange={(e) => setGuarantorRelationship(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 pr-10 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            >
              <option value="">Select relationship</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm ${
            isValid
              ? "bg-[#FF6B35] hover:bg-[#e85a26] text-white active:scale-[0.99]"
              : "bg-[#FF6B35]/50 text-white cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
