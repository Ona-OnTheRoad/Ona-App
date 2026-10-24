"use client";

import { SheetSelect } from "@/components/ui/option-sheet";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ProService } from "@/lib/types";
import { PRO_TRADE_OPTIONS } from "@/lib/services";
import { EXP_YEARS, experienceLabel } from "../constants";
import { TradePickerSheet } from "./trade-picker-sheet";
import { SpecialtyPickerSheet } from "./specialty-picker-sheet";

interface Step2RepairServiceProps {
  skill: ProService | null;
  onSelectSkill: (skill: ProService) => void;
  specialty: string;
  onSelectSpecialty: (specialty: string) => void;
  businessName: string;
  setBusinessName: (val: string) => void;
  yearsExperience: string;
  setYearsExperience: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  onContinue: () => void;
}

export function Step2RepairService({
  skill,
  onSelectSkill,
  specialty,
  onSelectSpecialty,
  businessName,
  setBusinessName,
  yearsExperience,
  setYearsExperience,
  bio,
  setBio,
  onContinue,
}: Step2RepairServiceProps) {
  const [showTradeSheet, setShowTradeSheet] = useState(false);
  const [showSpecialtySheet, setShowSpecialtySheet] = useState(false);

  const selectedTradeLabel =
    PRO_TRADE_OPTIONS.find((t) => t.id === skill)?.label || "";

  const isValid =
    Boolean(skill) &&
    specialty.trim().length > 0 &&
    businessName.trim().length >= 2;

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-ona-bg text-ona-ink">
      {/* Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ona-ink tracking-tight">
          Your Repair Service
        </h1>
        <p className="mt-1 text-xs text-ona-muted">
          Tell us what you do so nearby customers can find you.
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 flex-1">
        {/* Trade Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Trade
          </label>
          <button
            type="button"
            onClick={() => setShowTradeSheet(true)}
            className="w-full flex items-center justify-between bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-left focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
          >
            <span
              className={`text-sm ${
                selectedTradeLabel
                  ? "text-ona-ink font-medium"
                  : "text-ona-muted"
              }`}
            >
              {selectedTradeLabel || "Choose only one trade"}
            </span>
            <ChevronDown className="w-4 h-4 text-ona-muted shrink-0" />
          </button>
        </div>

        {/* Trade Focus Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Your trade focus
          </label>
          <button
            type="button"
            disabled={!skill}
            onClick={() => setShowSpecialtySheet(true)}
            className="w-full flex items-center justify-between bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-left disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
          >
            <span
              className={`text-sm ${
                specialty
                  ? "text-ona-ink font-medium"
                  : "text-ona-muted"
              }`}
            >
              {specialty || "Where do you mainly work?"}
            </span>
            <ChevronDown className="w-4 h-4 text-ona-muted shrink-0" />
          </button>
        </div>

        {/* Workshop / Business Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Workshop / Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Yaba, Lekki"
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>

        {/* Years of Experience */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Years of Experience
          </label>
          <SheetSelect
            bare
            title="Years of Experience"
            value={yearsExperience}
            onChange={(v) => setYearsExperience(v)}
            placeholder="Select experience"
            options={EXP_YEARS.map((y) => ({
              value: String(y),
              label: experienceLabel(y),
            }))}
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            chevronClassName="right-3.5 text-ona-muted"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write text here …"
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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

      {/* Trade Picker Sheet */}
      <TradePickerSheet
        open={showTradeSheet}
        onClose={() => setShowTradeSheet(false)}
        selectedTrade={skill}
        onSelectTrade={(newSkill) => {
          onSelectSkill(newSkill);
          onSelectSpecialty(""); // reset specialty when trade changes
        }}
      />

      {/* Specialty Picker Sheet */}
      <SpecialtyPickerSheet
        open={showSpecialtySheet}
        onClose={() => setShowSpecialtySheet(false)}
        trade={skill}
        selectedSpecialty={specialty}
        onSelectSpecialty={onSelectSpecialty}
      />
    </div>
  );
}
