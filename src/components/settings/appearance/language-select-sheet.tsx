"use client";

import { useEffect, useState } from "react";
import { LOCALES, type LocaleCode, useI18n } from "@/lib/i18n";
import { loadCatalog } from "@/lib/i18n/catalog";
import { cn } from "@/lib/utils";

interface LanguageSelectSheetProps {
  open: boolean;
  onClose: () => void;
  isLight: boolean;
}

// Ensure the top 5 match the design mockup in exact order, followed by other supported locales
const ORDERED_LANGUAGE_CODES: LocaleCode[] = [
  "en", // English
  "yo", // Yoruba
  "ha", // Hausa
  "ig", // Igbo
  "pcm", // Pidgin
  "fr", // French
  "pt", // Portuguese
  "ar", // Arabic
  "es", // Spanish
  "sw", // Swahili
  "zh", // Chinese
];

// Display names matching the design
const LANGUAGE_DISPLAY_NAMES: Partial<Record<LocaleCode, string>> = {
  en: "English",
  yo: "Yoruba",
  ha: "Hausa",
  ig: "Igbo",
  pcm: "Pidgin",
  fr: "French",
  pt: "Portuguese",
  ar: "Arabic",
  es: "Spanish",
  sw: "Swahili",
  zh: "Chinese",
};

export function LanguageSelectSheet({
  open,
  onClose,
  isLight,
}: LanguageSelectSheetProps) {
  const { locale, setLocale, t } = useI18n();
  const [selected, setSelected] = useState<LocaleCode>(locale);

  // Sync selected and preload catalogs when opened for instantaneous switching
  useEffect(() => {
    if (open) {
      setSelected(locale);
      ORDERED_LANGUAGE_CODES.forEach((c) => {
        if (c !== "en") void loadCatalog(c);
      });
    }
  }, [open, locale]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelectLanguage = (code: LocaleCode) => {
    setSelected(code);
    setLocale(code);
  };

  const handleSave = () => {
    setLocale(selected);
    onClose();
  };

  // Build ordered list of language objects
  const availableLanguages = ORDERED_LANGUAGE_CODES.map((code) => {
    const meta = LOCALES.find((l) => l.code === code);
    return {
      code,
      label: LANGUAGE_DISPLAY_NAMES[code] || meta?.name || code,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-lg rounded-t-[28px] p-5 shadow-2xl transition-all duration-200 animate-in slide-in-from-bottom bg-ona-surface text-ona-ink border-t border-ona-border">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ona-field-strong" />

        {/* Title */}
        <h2 className="text-[16px] font-bold tracking-tight mb-4 text-ona-ink">
          {t("language.selectTitle")}
        </h2>

        {/* Languages Card List (Top 5 visible immediately, others scrollable) */}
        <div
          className="rounded-ona-ctl border border-ona-border bg-ona-surface divide-y divide-ona-border overflow-y-auto max-h-72.5 scrollbar-hide"
          role="radiogroup"
          aria-label="Select language"
        >
          {availableLanguages.map((lang) => {
            const isSelected = selected === lang.code;

            return (
              <div
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectLanguage(lang.code);
                  }
                }}
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors hover:bg-black/2 active:bg-black/4 dark:hover:bg-white/3 dark:active:bg-white/5"
              >
                <span className="text-[12px] font-medium leading-tight text-ona-ink">
                  {lang.label}
                </span>

                {/* Radio Button */}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all border-2",
                    isSelected
                      ? "border-brand"
                      : "border-ona-border",
                  )}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Changes Button */}
        <button
          type="button"
          onClick={handleSave}
          className="mt-5 flex w-full items-center justify-center rounded-ona-ctl bg-brand py-3.5 text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.99] shadow-sm"
        >
          {t("language.saveChanges")}
        </button>
      </div>
    </div>
  );
}
