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
    <div className="ona2 fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-md mx-auto bg-ona-surface text-ona-ink rounded-t-3xl shadow-xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200 border-t border-ona-border">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-ona-muted/30" />
        </div>

        {/* Header */}
        <div className="px-5 pt-1 pb-3 border-b border-ona-border">
          <h2 className="text-base font-bold text-ona-ink">
            Choose only one trade
          </h2>
        </div>

        {/* Trade list */}
        <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-ona-border">
          {PRO_TRADE_OPTIONS.map((item) => {
            const isSelected = draft === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setDraft(item.id)}
                className="w-full flex items-center justify-between py-3.5 text-left group cursor-pointer"
              >
                <span
                  className={`text-sm ${
                    isSelected
                      ? "font-semibold text-ona-ink"
                      : "text-ona-ink/80 group-hover:text-ona-ink"
                  }`}
                >
                  {item.label}
                </span>

                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-brand bg-brand"
                      : "border-ona-border bg-transparent"
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
        <div className="p-5 border-t border-ona-border bg-ona-surface">
          <button
            type="button"
            disabled={!draft}
            onClick={() => {
              if (draft) {
                onSelectTrade(draft);
                onClose();
              }
            }}
            className="w-full py-3.5 px-6 rounded-full font-semibold text-sm bg-brand hover:opacity-90 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
