"use client";

import type { FeaturesSection } from "@/lib/app-config";
import { Check } from "lucide-react";

const FLAGS: { key: keyof FeaturesSection; label: string; help: string }[] = [
  {
    key: "signupMotorist",
    label: "Keep profile private",
    help: "Default ON. Details stay private until needed for a booking.",
  },
  {
    key: "signupPro",
    label: "Repair Pro signup",
    help: "Allow new professional accounts",
  },
  {
    key: "mapsLive",
    label: "Live Google Maps",
    help: "Use live map tiles when API key is set",
  },
  {
    key: "paymentsEnabled",
    label: "Payments",
    help: "Show payment flows in the app",
  },
  {
    key: "chatEnabled",
    label: "Messages / chat",
    help: "Enable motorist <> pro messaging",
  },
  {
    key: "reviewsEnabled",
    label: "Reviews",
    help: "Allow ratings after completed jobs",
  },
  {
    key: "bookingsEnabled",
    label: "Bookings",
    help: "Show bookings history screens",
  },
  {
    key: "proOnlineToggle",
    label: "Pro online toggle",
    help: "Pros can go online/offline on dashboard",
  },
  {
    key: "identityVerifyEnabled",
    label: "Identity verification",
    help: "NIN/BVN gate after free trial actions",
  },
];

interface FeatureFlagsTabProps {
  features: FeaturesSection | null;
  onChange: (updated: FeaturesSection) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function FeatureFlagsTab({
  features,
  onChange,
  onSave,
  saving,
}: FeatureFlagsTabProps) {
  if (!features) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-12 text-center text-gray-500">
        Loading feature flags…
      </div>
    );
  }

  function toggle(key: keyof FeaturesSection) {
    if (!features) return;
    onChange({
      ...features,
      [key]: !features[key],
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Feature flags
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Feature flags for the live app. Turn modules on/off without a redeploy (Super Admin).
        </p>
      </div>

      {/* Card: Switches */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Switches
          </h3>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="px-5 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {FLAGS.map((f) => {
            const isChecked = Boolean(features[f.key]);
            return (
              <div
                key={f.key}
                onClick={() => toggle(f.key)}
                className="py-4 flex items-start gap-3.5 cursor-pointer select-none group"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked
                      ? "bg-ona-brand-btn text-white"
                      : "border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-ona-brand transition-colors">
                    {f.label}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {f.help}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

