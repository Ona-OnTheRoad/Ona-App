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
  const { t, locale } = useI18n();
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

  const getSystemDefaultLabel = () => {
    switch (locale) {
      case "yo":
        return "Aṣàyàn ẹ̀rọ";
      case "ha":
        return "Tsohon tsarin";
      case "ig":
        return "Ndokwa sistemu";
      case "pcm":
        return "System default";
      case "fr":
        return "Système par défaut";
      case "es":
        return "Predeterminado del sistema";
      case "pt":
        return "Padrão do sistema";
      case "ar":
        return "افتراضي النظام";
      case "sw":
        return "Chaguo-msingi";
      case "zh":
        return "系统默认";
      default:
        return "System default";
    }
  };

  const getHeaderLabel = () => {
    switch (locale) {
      case "yo":
        return "ÀÀBÒ ÀKỌỌ́LẸ̀";
      case "ha":
        return "TSARON ASUSU";
      case "ig":
        return "NCHEKWA AKAỤNTỤ";
      case "pcm":
        return "ACCOUNT SECURITY";
      case "fr":
        return "SÉCURITÉ DU COMPTE";
      case "es":
        return "SEGURIDAD DE LA CUENTA";
      case "pt":
        return "SEGURANÇA DA CONTA";
      case "ar":
        return "أمان الحساب";
      case "sw":
        return "USALAMA WA AKAUNTI";
      case "zh":
        return "账户安全";
      default:
        return "ACCOUNT SECURITY";
    }
  };

  const themeOptions: {
    id: ThemeSelection;
    label: string;
    icon: typeof Settings;
  }[] = [
    { id: "system", label: getSystemDefaultLabel(), icon: Settings },
    { id: "light", label: t("settings.lightMode"), icon: Sun },
    { id: "dark", label: t("settings.darkMode"), icon: Moon },
  ];

  return (
    <div>
      {/* Section Header */}
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-ona-muted mb-3 px-1">
        {getHeaderLabel()}
      </h2>

      {/* Card Container */}
      <div className="rounded-ona-ctl border border-ona-border bg-ona-surface divide-y divide-ona-border shadow-sm p-2 sm:p-3 overflow-hidden">
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = selectedMode === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className="flex items-center justify-between px-3 py-3.5 cursor-pointer transition-colors rounded-ona-ctl hover:bg-black/2 active:bg-black/4 dark:hover:bg-white/3 dark:active:bg-white/5"
            >
              {/* Icon & Label */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ona-ctl bg-ona-field text-ona-muted">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <span className="text-[12px] font-medium leading-tight truncate text-ona-ink">
                  {opt.label}
                </span>
              </div>

              {/* iOS Style Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt.id);
                }}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  isActive ? "bg-brand" : "bg-ona-field-strong",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                    isActive ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
