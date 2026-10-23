"use client";

import { useEffect, useState } from "react";
import { Moon, Settings, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { DEVICE_THEME_KEY } from "@/lib/store/constants";
import { themeKeyForUser } from "@/lib/store/storage";
import { cn } from "@/lib/utils";

type ThemeSelection = "system" | "light" | "dark";

interface AppearanceThemeCardProps {
  isLight: boolean;
}

export function AppearanceThemeCard({ isLight }: AppearanceThemeCardProps) {
  const { theme, setTheme, backendUserId } = useApp();
  const { t } = useI18n();
  const [selectedMode, setSelectedMode] = useState<ThemeSelection>("system");

  // Determine whether current setting is system, light, or dark
  useEffect(() => {
    try {
      const userKey = themeKeyForUser(backendUserId);
      const userSaved = localStorage.getItem(userKey);
      const deviceSaved = localStorage.getItem(DEVICE_THEME_KEY);
      const isManual = userSaved || deviceSaved;

      if (!isManual) {
        setSelectedMode("system");
      } else {
        setSelectedMode(theme === "dark" ? "dark" : "light");
      }
    } catch {
      setSelectedMode(theme === "dark" ? "dark" : "light");
    }
  }, [theme, backendUserId]);

  const handleSelect = (mode: ThemeSelection) => {
    setSelectedMode(mode);
    if (mode === "system") {
      try {
        const userKey = themeKeyForUser(backendUserId);
        localStorage.removeItem(userKey);
        localStorage.removeItem(DEVICE_THEME_KEY);
      } catch {
        /* ignore */
      }
      const isSystemDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isSystemDark ? "dark" : "light");
    } else {
      setTheme(mode);
    }
  };

  const headerLabel = t("settings.theme").toUpperCase();

  const themeOptions: {
    id: ThemeSelection;
    label: string;
    icon: typeof Settings;
  }[] = [
    { id: "system", label: t("settings.systemDefault"), icon: Settings },
    { id: "light", label: t("settings.lightMode"), icon: Sun },
    { id: "dark", label: t("settings.darkMode"), icon: Moon },
  ];

  return (
    <div>
      {/* Section Header */}
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-ona-muted mb-3 px-1">
        {headerLabel}
      </h2>

      {/* Card Container with single-select radio options */}
      <div
        role="radiogroup"
        aria-label={headerLabel}
        className="rounded-ona-ctl border border-ona-border bg-ona-surface divide-y divide-ona-border shadow-sm p-2 sm:p-3 overflow-hidden"
      >
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = selectedMode === opt.id;

          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isActive}
              tabIndex={0}
              onClick={() => handleSelect(opt.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(opt.id);
                }
              }}
              className="flex items-center justify-between px-3 py-3.5 cursor-pointer transition-colors rounded-ona-ctl hover:bg-black/2 active:bg-black/4 dark:hover:bg-white/3 dark:active:bg-white/5"
            >
              {/* Icon & Label */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-ona-ctl transition-colors",
                    isActive
                      ? "bg-ona-brand-soft text-brand"
                      : "bg-ona-field text-ona-muted",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <span
                  className={cn(
                    "text-[12px] leading-tight truncate transition-colors",
                    isActive ? "font-semibold text-ona-ink" : "font-medium text-ona-ink",
                  )}
                >
                  {opt.label}
                </span>
              </div>

              {/* Single-select Radio Indicator */}
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all border-2",
                  isActive ? "border-brand" : "border-ona-border",
                )}
                aria-hidden="true"
              >
                {isActive && (
                  <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
