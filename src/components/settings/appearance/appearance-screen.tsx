"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Accessibility, ArrowLeft, ArrowRight } from "lucide-react";
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
          {/* Card 1: Theme selector */}
          <AppearanceThemeCard isLight={isLight} />

          {/* Card 2: Language selector card */}
          <AppearanceLanguageCard
            isLight={isLight}
            onOpenSelect={() => setLangSheetOpen(true)}
          />

          {/* Card 3: Accessibility */}
          <Link
            href="/settings/accessibility"
            className="flex items-center justify-between rounded-ona-ctl border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent px-4 py-4 transition-colors hover:bg-black/2 active:bg-black/4 dark:hover:bg-white/3 dark:active:bg-white/6 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ona-brand-soft">
                <Accessibility className="h-4 w-4 text-ona-brand-ink" />
              </div>
              <div>
                <p className="text-[14px] font-medium leading-tight text-ona-ink">
                  Accessibility
                </p>
                <p className="text-[12px] leading-tight mt-0.5 text-ona-muted">
                  Text size & high contrast
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-ona-muted opacity-70 group-hover:opacity-100 transition-opacity" />
          </Link>
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
