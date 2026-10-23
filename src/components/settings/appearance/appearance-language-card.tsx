"use client";

import { ChevronRight } from "lucide-react";
import { getLocaleMeta, useI18n } from "@/lib/i18n";

interface AppearanceLanguageCardProps {
  isLight?: boolean;
  onOpenSelect: () => void;
}

export function AppearanceLanguageCard({
  onOpenSelect,
}: AppearanceLanguageCardProps) {
  const { locale, t } = useI18n();
  const meta = getLocaleMeta(locale);

  // E.g. "English (EN)", "Yoruba (YO)", "Hausa (HA)"
  const displayLabel = `${meta.name} (${meta.code.toUpperCase()})`;

  return (
    <div>
      {/* Section Header */}
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-ona-muted mb-3 px-1">
        {t("settings.language")}
      </h2>

      {/* Card Container */}
      <div
        onClick={onOpenSelect}
        className="rounded-ona-ctl border border-ona-border bg-ona-surface shadow-sm p-4 cursor-pointer transition-colors flex items-center justify-between group hover:bg-black/2 active:bg-black/4 dark:hover:bg-white/3 dark:active:bg-white/5"
      >
        <span className="text-[12px] font-medium leading-tight text-ona-ink">
          {displayLabel}
        </span>

        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 text-ona-muted"
          strokeWidth={2}
        />
      </div>
    </div>
  );
}
