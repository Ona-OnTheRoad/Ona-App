"use client";

import { useState } from "react";

export type PinCategory = "Home" | "Work" | "Other";

interface SavePinCardProps {
  onSave: (finalLabel: string) => void;
  isSaving?: boolean;
}

export function SavePinCard({ onSave, isSaving = false }: SavePinCardProps) {
  const [selectedCategory, setSelectedCategory] = useState<PinCategory>("Home");
  const [customLabel, setCustomLabel] = useState("");

  const categories = ["Home", "Work", "Other"] as const;

  const handleSave = () => {
    let finalLabel: string = selectedCategory;
    if (selectedCategory === "Other") {
      finalLabel = customLabel.trim() ? customLabel.trim() : "Other";
    }
    onSave(finalLabel);
    if (selectedCategory === "Other") {
      setCustomLabel("");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted px-0.5">
        SAVE CURRENT PIN AS
      </p>

      {/* Category Chips */}
      <div className="flex items-center gap-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1 rounded-full text-[12px] transition-all cursor-pointer ${
                isSelected
                  ? "border border-[#F05A30] bg-[#FFF2EE] dark:bg-brand/15 text-[#F05A30] font-medium shadow-2xs"
                  : "border border-ona-border bg-white dark:bg-ona-surface text-ona-ink font-normal hover:border-ona-muted/60"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Custom label input if Other is selected */}
      {selectedCategory === "Other" && (
        <div className="pt-0.5">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Enter a label (e.g mum’s house)"
            className="h-12 w-full rounded-2xl border border-ona-border bg-white dark:bg-ona-surface px-4 text-[12px] font-normal text-ona-ink placeholder:text-ona-muted shadow-2xs outline-none focus:border-[#F05A30] transition-all"
          />
        </div>
      )}

      {/* Save Button */}
      <div className="pt-0.5">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full h-12 rounded-2xl bg-[#F05A30] hover:bg-[#E04F24] text-white font-medium text-[13px] flex items-center justify-center transition-all active:scale-[0.99] shadow-2xs cursor-pointer disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save labeled address"}
        </button>
      </div>
    </div>
  );
}
