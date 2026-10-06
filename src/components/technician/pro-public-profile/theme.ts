/** Light: flat sheet, no solid card bars. Dark: solid cards. */
export function publicProfileTheme(isLight: boolean) {
  return {
    pageBg: isLight ? "#c8c9cd" : "#000000",
    cardBg: isLight ? "transparent" : "#1c1c1e",
    insetBg: isLight ? "transparent" : "#2c2c2e",
    page: isLight ? "bg-[#c8c9cd]" : "bg-black",
    card: isLight ? "mb-1.5 rounded-2xl bg-black/[0.04]" : "bg-[#1c1c1e]",
    inset: isLight ? "bg-transparent" : "bg-[#2c2c2e]",
    ink: isLight ? "text-slate-900" : "text-white",
    muted: isLight ? "text-slate-600" : "text-[#a1a1a6]",
    soft: isLight ? "text-slate-700" : "text-[#d1d1d6]",
    solidBtn: isLight
      ? "bg-transparent text-slate-900 hover:bg-black/[0.04]"
      : "bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]",
  };
}

export type PublicProfileTheme = ReturnType<typeof publicProfileTheme>;
