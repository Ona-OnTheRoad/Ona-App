/** Light: flat sheet, no solid card bars. Dark: solid cards. */
export function publicProfileTheme(isLight: boolean) {
  return {
    pageBg: isLight ? "#ffffff" : "#111114",
    cardBg: isLight ? "transparent" : "#111113",
    insetBg: isLight ? "transparent" : "#1b1b1e",
    page: "ona2 bg-ona-bg",
    card: isLight ? "mb-1.5 rounded-2xl bg-black/[0.04]" : "bg-[#111113]",
    inset: isLight ? "bg-transparent" : "bg-[#1b1b1e]",
    ink: isLight ? "text-slate-900" : "text-white",
    muted: isLight ? "text-slate-600" : "text-[#a1a1a6]",
    soft: isLight ? "text-slate-700" : "text-[#d1d1d6]",
    solidBtn: isLight
      ? "bg-transparent text-slate-900 hover:bg-black/[0.04]"
      : "bg-[#1b1b1e] text-white hover:bg-[#3a3a3c]",
  };
}

export type PublicProfileTheme = ReturnType<typeof publicProfileTheme>;
