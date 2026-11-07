"use client";

import type { AppSection } from "@/lib/app-config";

interface AppSettingsTabProps {
  app: AppSection | null;
  onChange: (updated: AppSection) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function AppSettingsTab({
  app,
  onChange,
  onSave,
  saving,
}: AppSettingsTabProps) {
  if (!app) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-12 text-center text-gray-500">
        Loading app settings…
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          App settings
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Global app settings stored in Supabase. Changes here control the live Ona app (fees, features, copy).
        </p>
      </div>

      {/* Card: General */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            General
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

        <div className="space-y-5 pt-6">
          {/* App Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              App name
            </label>
            <input
              type="text"
              value={app.name}
              onChange={(e) => onChange({ ...app, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white focus:border-ona-brand transition-colors"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={app.tagline}
              onChange={(e) => onChange({ ...app, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white focus:border-ona-brand transition-colors"
            />
          </div>

          {/* Support Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Support email
              </label>
              <input
                type="email"
                value={app.supportEmail}
                onChange={(e) => onChange({ ...app, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white focus:border-ona-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Support phone
              </label>
              <input
                type="text"
                value={app.supportPhone}
                onChange={(e) => onChange({ ...app, supportPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white focus:border-ona-brand transition-colors"
              />
            </div>
          </div>

          {/* Theme Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Default theme
              </label>
              <select
                value={app.defaultTheme}
                onChange={(e) =>
                  onChange({
                    ...app,
                    defaultTheme: e.target.value as "light" | "dark",
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Force theme (optional)
              </label>
              <select
                value={app.forceTheme ?? ""}
                onChange={(e) =>
                  onChange({
                    ...app,
                    forceTheme: (e.target.value || null) as
                      | "light"
                      | "dark"
                      | null,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="">User choice</option>
                <option value="light">Force light</option>
                <option value="dark">Force dark</option>
              </select>
            </div>
          </div>

          {/* Maintenance Mode Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={app.maintenanceMode}
                onChange={(e) =>
                  onChange({ ...app, maintenanceMode: e.target.checked })
                }
                className="w-4 h-4 rounded text-ona-brand accent-[#f05638] cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                Maintenance mode (blocks public app usage)
              </span>
            </label>
          </div>

          {/* Maintenance Message */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Maintenance message
            </label>
            <textarea
              rows={4}
              value={app.maintenanceMessage}
              onChange={(e) =>
                onChange({ ...app, maintenanceMessage: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white focus:border-ona-brand transition-colors resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

