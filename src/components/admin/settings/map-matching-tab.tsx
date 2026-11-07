"use client";

import type { MatchingSection, VerificationSection } from "@/lib/app-config";
import type {
  CalloutPolicyAdmin,
  CalloutTradeAdmin,
} from "@/components/admin/matching/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { CALLOUT_FOURTEENTH_TRADE } from "@/lib/callout/constants";
import { Check } from "lucide-react";

interface MapMatchingTabProps {
  matching: MatchingSection | null;
  verification: VerificationSection | null;
  calloutPolicy: CalloutPolicyAdmin | null;
  calloutTrades: CalloutTradeAdmin[];
  maintenanceMode: boolean;
  onMaintenanceModeChange: (val: boolean) => void;
  onMatchingChange: (m: MatchingSection) => void;
  onVerificationChange: (v: VerificationSection) => void;
  onCalloutPolicyChange: (p: CalloutPolicyAdmin) => void;
  onCalloutTradesChange: (trades: CalloutTradeAdmin[]) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function MapMatchingTab({
  matching,
  verification,
  calloutPolicy,
  calloutTrades,
  maintenanceMode,
  onMaintenanceModeChange,
  onMatchingChange,
  onVerificationChange,
  onCalloutPolicyChange,
  onCalloutTradesChange,
  onSave,
  saving,
}: MapMatchingTabProps) {
  if (!matching || !verification) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-12 text-center text-gray-500">
        Loading matching rules…
      </div>
    );
  }

  function handleTradeFeeChange(tradeId: string, baseFee: number) {
    onCalloutTradesChange(
      calloutTrades.map((t) => (t.tradeId === tradeId ? { ...t, baseFee } : t)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Map & matching
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Map radius and matching rules that decide which pros customers see on the live map.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="px-4 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save matching & verification"}
        </button>
      </div>

      {/* Top Grid: Matching & Verification Gate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Matching */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">
            Matching
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Max search radius (km)
                </label>
                <input
                  type="number"
                  value={matching.maxRadiusKm}
                  onChange={(e) =>
                    onMatchingChange({
                      ...matching,
                      maxRadiusKm: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Default radius (km)
                </label>
                <input
                  type="number"
                  value={matching.defaultRadiusKm}
                  onChange={(e) =>
                    onMatchingChange({
                      ...matching,
                      defaultRadiusKm: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Max technicians shown
                </label>
                <input
                  type="number"
                  value={matching.maxTechnicians}
                  onChange={(e) =>
                    onMatchingChange({
                      ...matching,
                      maxTechnicians: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Min rating filter (0 = off)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={matching.minRatingFilter}
                  onChange={(e) =>
                    onMatchingChange({
                      ...matching,
                      minRatingFilter: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => onMaintenanceModeChange(e.target.checked)}
                  className="w-4 h-4 rounded text-ona-brand accent-[#f05638] cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Maintenance mode (blocks public app usage)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Verification Gate */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">
            Verification gate
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Warn from action #
                </label>
                <input
                  type="number"
                  value={verification.warnFrom ?? 5}
                  onChange={(e) =>
                    onVerificationChange({
                      ...verification,
                      warnFrom: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Block at action #
                </label>
                <input
                  type="number"
                  value={verification.blockAt ?? 5}
                  onChange={(e) =>
                    onVerificationChange({
                      ...verification,
                      blockAt: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verification.requireNin}
                  onChange={(e) =>
                    onVerificationChange({
                      ...verification,
                      requireNin: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-ona-brand accent-[#f05638] cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Require NIN
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verification.requireBvn}
                  onChange={(e) =>
                    onVerificationChange({
                      ...verification,
                      requireBvn: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-ona-brand accent-[#f05638] cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Require BVN
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Call-out Fee */}
      {calloutPolicy && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Call-out fee
            </h3>

            {/* Callout Enabled Checkbox */}
            <div className="mb-5">
              <label
                onClick={() =>
                  onCalloutPolicyChange({
                    ...calloutPolicy,
                    enabled: !calloutPolicy.enabled,
                  })
                }
                className="inline-flex items-center gap-2.5 cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    calloutPolicy.enabled
                      ? "bg-ona-brand-btn text-white"
                      : "border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  Call-out enabled
                </span>
              </label>
            </div>

            {/* 3 Parameter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Rate per km (₦)
                </label>
                <input
                  type="number"
                  value={calloutPolicy.ratePerKm}
                  onChange={(e) =>
                    onCalloutPolicyChange({
                      ...calloutPolicy,
                      ratePerKm: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Minimum billable distance (km)
                </label>
                <input
                  type="number"
                  value={calloutPolicy.minimumBillableDistanceKm}
                  onChange={(e) =>
                    onCalloutPolicyChange({
                      ...calloutPolicy,
                      minimumBillableDistanceKm: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Maximum radius (km)
                </label>
                <input
                  type="number"
                  value={calloutPolicy.maximumRadiusKm}
                  onChange={(e) =>
                    onCalloutPolicyChange({
                      ...calloutPolicy,
                      maximumRadiusKm: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                />
              </div>
            </div>
          </div>

          {/* Subheader Banner */}
          <div className="bg-[#f3f4f8] dark:bg-[#182030] px-6 py-3 border-y border-gray-200 dark:border-white/5">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Trade base fees (₦). Diagnostics is the existing 14th trade.
            </span>
          </div>

          {/* 4-column Grid of Trades */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {calloutTrades.map((t) => {
                const is14th = t.tradeId === CALLOUT_FOURTEENTH_TRADE;
                const label = PRO_SERVICE_LABELS[t.tradeId] ?? t.tradeId;
                return (
                  <div key={t.tradeId}>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 truncate">
                      {label}
                      {is14th ? " (14th)" : ""}
                    </label>
                    <input
                      type="number"
                      value={t.baseFee}
                      onChange={(e) =>
                        handleTradeFeeChange(t.tradeId, Number(e.target.value) || 0)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
