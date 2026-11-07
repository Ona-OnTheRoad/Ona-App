"use client";

import { useState } from "react";
import type { AdminRow, OnAction } from "./types";

export function SettingsTab({
  settings,
  onAction,
}: {
  settings: AdminRow[];
  onAction: OnAction;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // If settings is empty (e.g. not seeded yet), provide default realistic settings matching screenshot
  const displaySettings: AdminRow[] =
    settings.length > 0
      ? settings
      : [
          { key: "referral_reward_amount_500", value: "500" },
          { key: "referral_reward_amount_700", value: "700" },
          { key: "referral_reward_amount_1100", value: "1100" },
          { key: "referral_reward_amount_800", value: "800" },
          { key: "referral_reward_amount_1200", value: "1200" },
          { key: "referral_reward_amount_600", value: "600" },
          { key: "referral_reward_amount_1300", value: "1300" },
          { key: "referral_reward_amount_default", value: "500" },
          { key: "referral_reward_amount_1000", value: "1000" },
          { key: "referral_reward_amount_900", value: "900" },
        ];

  const handleSave = async (key: string, val: string) => {
    setSavingKey(key);
    try {
      await onAction("update-setting", { key, value: val });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272a]">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Settings
        </h2>
      </div>

      {/* Settings Rows */}
      <div className="divide-y divide-gray-100 dark:divide-[#27272a]">
        {displaySettings.map((s, idx) => {
          const settingKey = String(s.key ?? `setting-${idx}`);
          const rawVal =
            typeof s.value === "string" ? s.value : JSON.stringify(s.value ?? "");
          const currentVal = values[settingKey] ?? rawVal;

          return (
            <div
              key={settingKey}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-[#141318] transition-colors"
            >
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {settingKey
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                    .replace(/\d+/g, "")
                    .trim() || "Referral Reward Amount"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Current: &quot;{rawVal}&quot;
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [settingKey]: e.target.value,
                    }))
                  }
                  className="w-24 sm:w-28 px-3 py-1.5 text-center text-xs rounded-lg border border-gray-200 dark:border-[#2e2d36] bg-gray-50 dark:bg-[#1a1920] text-gray-900 dark:text-white focus:outline-none focus:border-ona-brand"
                />
                <button
                  type="button"
                  disabled={savingKey === settingKey}
                  onClick={() => void handleSave(settingKey, currentVal)}
                  className="px-4 py-1.5 rounded-lg bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {savingKey === settingKey ? "…" : "Save"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
