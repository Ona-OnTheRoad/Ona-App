"use client";

import type { ServicesSection } from "@/lib/app-config";
import { PRO_TRADE_OPTIONS } from "@/lib/services";
import { Check } from "lucide-react";

interface ServicesCatalogTabProps {
  services: ServicesSection | null;
  onToggle: (tradeId: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function ServicesCatalogTab({
  services,
  onToggle,
  onSave,
  saving,
}: ServicesCatalogTabProps) {
  if (!services) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-12 text-center text-gray-500">
        Loading services catalog…
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Services catalog
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Service catalog (trades) offered on Ona. Keep labels aligned with signup and home filters.
        </p>
      </div>

      {/* Card: Trades */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Trades
          </h3>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="px-5 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save catalog"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-b border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3.5">Service</th>
                <th className="px-6 py-3.5">Hint</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {PRO_TRADE_OPTIONS.map((t) => {
                const isOn = services.enabled.includes(t.id);
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-medium text-gray-900 dark:text-white">
                      {t.label}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {t.hint}
                    </td>
                    <td className="px-6 py-4 text-xs text-right">
                      <button
                        type="button"
                        onClick={() => onToggle(t.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          isOn
                            ? "bg-ona-brand-btn text-white shadow-xs"
                            : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {isOn && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        <span>{isOn ? "On" : "Off"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

