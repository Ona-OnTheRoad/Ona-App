"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppearanceThemeCard } from "./appearance-theme-card";
import { AppearanceLanguageCard } from "./appearance-language-card";
import { LanguageSelectSheet } from "./language-select-sheet";
import { useI18n } from "@/lib/i18n";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

interface AppearanceScreenProps {
  isLight?: boolean;
}

export function AppearanceScreen({ isLight: propIsLight }: AppearanceScreenProps) {
  const router = useRouter();
  const { theme, accountType } = useApp();
  const { t } = useI18n();
  const isLight = propIsLight ?? theme === "light";
  const [langSheetOpen, setLangSheetOpen] = useState(false);

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20">
        {/* Top Back bar */}
        <div className="flex items-center pt-3 pb-1 mb-2">
          <button
            type="button"
            onClick={() => navigateBack(router, "/profile", accountType)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Screen Title */}
        <h1 className="text-[20px] font-semibold tracking-tight mb-6 text-ona-ink">
          {t("settings.appearance")}
        </h1>

        <div className="space-y-6">
          {/* Card 1: Theme switches */}
          <AppearanceThemeCard isLight={isLight} />

          {/* Card 2: Language selector card */}
          <AppearanceLanguageCard
            isLight={isLight}
            onOpenSelect={() => setLangSheetOpen(true)}
          />
        </div>
      </div>

      {/* Language Selection Bottom Sheet */}
      <LanguageSelectSheet
        open={langSheetOpen}
        onClose={() => setLangSheetOpen(false)}
        isLight={isLight}
      />
    </div>
  );
}
