import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";
import type { OnboardingStyles } from "./types";

/** Theme tokens + shared class strings for every onboarding step */
export function buildOnboardingStyles(isLight: boolean): OnboardingStyles {
  const tokens = profileTheme(isLight);
  return {
    isLight,
    sheetBg: tokens.sheetBg,
    ink: tokens.ink,
    muted: tokens.muted,
    soft: tokens.soft,
    // Apple premium: single sheet, hairline fields only (no nested fills)
    fieldClass: cn(
      "h-11 w-full border-0 border-b bg-transparent px-0 text-[16px] font-medium outline-none",
      isLight
        ? "border-black/15 text-[#1c1c1e] placeholder:text-slate-400"
        : "border-white/20 text-white placeholder:text-white/35",
    ),
    selectClass: cn(
      "h-11 w-full border-0 border-b bg-transparent px-0 text-[16px] font-semibold outline-none",
      isLight ? "border-black/15 text-[#1c1c1e]" : "border-white/20 text-white",
    ),
    panelClass: "rounded-none border-0 bg-transparent p-0",
    chipOff: isLight
      ? "bg-transparent text-slate-800 border border-black/10"
      : "bg-transparent text-[#d1d1d6] border border-white/15",
    uploadClass: cn(
      "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-[13px] font-semibold",
      isLight
        ? "border-black/20 bg-transparent text-slate-800"
        : "border-white/25 bg-transparent text-white",
    ),
    errBox: isLight ? "bg-red-50 text-red-700" : "bg-red-950/50 text-red-300",
    msgBox: isLight
      ? "bg-emerald-50 text-emerald-800"
      : "bg-emerald-950/40 text-emerald-300",
    warnBox: isLight
      ? "bg-[#FF6B35]/15 text-[#FF6B35]"
      : "bg-amber-950/40 text-[#FF6B35]",
    tipBox: isLight
      ? "bg-[#fff7ed] text-[#9a3412]"
      : "bg-[#3a2010] text-[#fdba74]",
    navBack: isLight
      ? "bg-transparent text-slate-600"
      : "bg-transparent text-white/60",
    tradeOff: isLight
      ? "bg-transparent text-slate-900 border-b border-black/10"
      : "bg-transparent text-white border-b border-white/10",
    /** Selected chips brand orange for all Yes/No and option picks */
    chipOn: "bg-[#FF6B35] text-white",
  };
}
