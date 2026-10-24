"use client";

import { useEffect, useState } from "react";
import type { ProService } from "@/lib/types";
import { PRO_TRADE_OPTIONS } from "@/lib/services";

interface TradePickerSheetProps {
  open: boolean;
  onClose: () => void;
  selectedTrade: ProService | null;
  onSelectTrade: (trade: ProService) => void;
}

export function TradePickerSheet({
  open,
  onClose,
  selectedTrade,
  onSelectTrade,
}: TradePickerSheetProps) {
  const [draft, setDraft] = useState<ProService | null>(selectedTrade);

  useEffect(() => {
    if (open) {
      setDraft(selectedTrade);
    }
  }, [open, selectedTrade]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-md mx-auto bg-white dark:bg-[#121316] rounded-t-3xl shadow-xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-750" />
        </div>

        {/* Header */}
        <div className="px-5 pt-1 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Choose only one trade
          </h2>
        </div>

        {/* Trade list */}
        <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-slate-100 dark:divide-slate-800">
          {PRO_TRADE_OPTIONS.map((item) => {
            const isSelected = draft === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setDraft(item.id)}
                className="w-full flex items-center justify-between py-3.5 text-left group"
              >
                <span
                  className={`text-sm ${
                    isSelected
                      ? "font-semibold text-slate-900 dark:text-white"
                      : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </span>

                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-[#FF6B35] bg-[#FF6B35]"
                      : "border-slate-300 dark:border-slate-600 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#121316]">
          <button
            type="button"
            disabled={!draft}
            onClick={() => {
              if (draft) {
                onSelectTrade(draft);
                onClose();
              }
            }}
            className="w-full py-3.5 px-6 rounded-full font-semibold text-sm bg-[#FF6B35] hover:bg-[#e85a26] text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
