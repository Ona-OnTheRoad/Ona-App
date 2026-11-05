"use client";

import { useState } from "react";
import type { ContentSection, MenuItemOverride } from "@/lib/app-config";
import { NAV_SCHEMA } from "@/lib/nav-schema";
import { Check, Info } from "lucide-react";

interface ContentMenusTabProps {
  content: ContentSection | null;
  problemsText: string;
  onContentChange: (updated: ContentSection) => void;
  onProblemsTextChange: (text: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function ContentMenusTab({
  content,
  problemsText,
  onContentChange,
  onProblemsTextChange,
  onSave,
  saving,
}: ContentMenusTabProps) {
  const [stringsJson, setStringsJson] = useState(() =>
    JSON.stringify(
      content?.strings || {
        releaseCta: "I am Satisfied - Release",
        disputeCta: "Open a dispute",
        autoReleaseNote: "Auto-releases after 6 hours if no dispute",
      },
      null,
      2,
    ),
  );

  if (!content) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-12 text-center text-gray-500">
        Loading content & menus…
      </div>
    );
  }

  function handleStringsBlur() {
    try {
      const parsed = JSON.parse(stringsJson);
      onContentChange({ ...content!, strings: parsed });
    } catch {
      // ignore parse errors until valid
    }
  }

  function updateMenuOverride(
    role: "client" | "pro",
    id: string,
    patch: MenuItemOverride,
  ) {
    const key = role === "client" ? "mainMenuOverrides" : "proMenuOverrides";
    const current = content![key] || {};
    const existing = current[id] || {};
    const nextItem: MenuItemOverride = { ...existing, ...patch };

    onContentChange({
      ...content!,
      [key]: {
        ...current,
        [id]: nextItem,
      },
    });
  }

  const clientRows = NAV_SCHEMA.filter((r) => r.role === "client");
  const proRows = NAV_SCHEMA.filter((r) => r.role === "pro");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Content, menus & copy
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Backend-controlled app text, menus, titles, and arrangement (L4 Manager+). Customers and pros see updates after save design shell stays the same.
          </p>
        </div>
      </div>

      {/* Main Card: Public copy, menus & strings */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Public copy, menus & strings
          </h3>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="px-5 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save content"}
          </button>
        </div>

        <div className="space-y-5 pt-6">
          {/* App Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              App title
            </label>
            <input
              type="text"
              value={content.appTitle || "Ona"}
              onChange={(e) =>
                onContentChange({ ...content, appTitle: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
            />
          </div>

          {/* Home Search Placeholder */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Home search placeholder
            </label>
            <input
              type="text"
              value={content.homeSearchPlaceholder || "Search problem, technician, service..."}
              onChange={(e) =>
                onContentChange({
                  ...content,
                  homeSearchPlaceholder: e.target.value,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
            />
          </div>

          {/* Login Subtitle */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Login subtitle
            </label>
            <input
              type="text"
              value={content.loginSubtitle || "Motorist & Repair Pro"}
              onChange={(e) =>
                onContentChange({ ...content, loginSubtitle: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
            />
          </div>

          {/* Home Banner */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Home banner (optional)
            </label>
            <textarea
              rows={3}
              value={content.homeBanner || ""}
              onChange={(e) =>
                onContentChange({ ...content, homeBanner: e.target.value })
              }
              placeholder="Shown at top of home when non-empty"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand resize-none"
            />
          </div>

          {/* Problem List */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Request help problem list (one per line)
            </label>
            <textarea
              rows={6}
              value={problemsText}
              onChange={(e) => onProblemsTextChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand resize-none font-mono"
            />
          </div>

          {/* Key UI Strings */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Key UI strings (JSON)
            </label>
            <textarea
              rows={6}
              value={stringsJson}
              onChange={(e) => setStringsJson(e.target.value)}
              onBlur={handleStringsBlur}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand resize-none font-mono"
            />
          </div>

          {/* Tips Callout Banner */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white mb-1">
              <Info className="w-4 h-4 text-gray-500" />
              <span>Tips</span>
            </div>
            <p>
              The app sidebar always keeps every menu row; you can only hide, reorder, or rename existing rows here (Home/Dashboard and Settings can never be hidden). Leave Order blank to keep the default position. Label override replaces the app&apos;s translated label for everyone. Changes go live after save (the app picks them up within ~2 minutes).
            </p>
          </div>
        </div>
      </div>

      {/* Customer Sidebar Menu Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Customer sidebar menu
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-b border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3 w-20">Visible</th>
                <th className="px-6 py-3">Row</th>
                <th className="px-6 py-3 w-40">Order</th>
                <th className="px-6 py-3">Label Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {clientRows.map((row) => {
                const ov = content.mainMenuOverrides?.[row.id] || {};
                const protectedRow =
                  row.id === "home" ||
                  row.id === "dashboard" ||
                  row.id === "settings";
                const isChecked = !ov.hidden;

                return (
                  <tr
                    key={`client-${row.id}`}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        disabled={protectedRow}
                        onClick={() =>
                          updateMenuOverride("client", row.id, {
                            hidden: isChecked,
                          })
                        }
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                          isChecked
                            ? "bg-ona-brand-btn text-white"
                            : "border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </td>

                    <td className="px-6 py-3 text-xs font-medium text-gray-900 dark:text-white">
                      {row.label}
                      {protectedRow && (
                        <span className="text-gray-400 font-normal ml-1">
                          (always visible)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={ov.order ?? ""}
                        placeholder="Default"
                        onChange={(e) =>
                          updateMenuOverride("client", row.id, {
                            order:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          })
                        }
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={ov.label ?? ""}
                        placeholder={row.label}
                        onChange={(e) =>
                          updateMenuOverride("client", row.id, {
                            label: e.target.value,
                          })
                        }
                        className="w-full max-w-sm px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repair Pro Menu Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Repair Pro menu
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-b border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3 w-20">Visible</th>
                <th className="px-6 py-3">Row</th>
                <th className="px-6 py-3 w-40">Order</th>
                <th className="px-6 py-3">Label Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {proRows.map((row) => {
                const ov = content.proMenuOverrides?.[row.id] || {};
                const protectedRow =
                  row.id === "home" ||
                  row.id === "dashboard" ||
                  row.id === "settings";
                const isChecked = !ov.hidden;

                return (
                  <tr
                    key={`pro-${row.id}`}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        disabled={protectedRow}
                        onClick={() =>
                          updateMenuOverride("pro", row.id, {
                            hidden: isChecked,
                          })
                        }
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                          isChecked
                            ? "bg-ona-brand-btn text-white"
                            : "border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </td>

                    <td className="px-6 py-3 text-xs font-medium text-gray-900 dark:text-white">
                      {row.label}
                      {protectedRow && (
                        <span className="text-gray-400 font-normal ml-1">
                          (always visible)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={ov.order ?? ""}
                        placeholder="Default"
                        onChange={(e) =>
                          updateMenuOverride("pro", row.id, {
                            order:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          })
                        }
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={ov.label ?? ""}
                        placeholder={row.label}
                        onChange={(e) =>
                          updateMenuOverride("pro", row.id, {
                            label: e.target.value,
                          })
                        }
                        className="w-full max-w-sm px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-white focus:border-ona-brand"
                      />
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
