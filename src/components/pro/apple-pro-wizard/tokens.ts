import { cn } from "@/lib/utils";

export const PRO_SHEET_LIGHT = "#c8c9cd";
export const PRO_SHEET_DARK = "#000000";
export const PRO_CTA = "#323231";
export const PRO_ACCENT = "#FF6B35";

export function proSheetBg(isLight: boolean) {
  return isLight ? PRO_SHEET_LIGHT : PRO_SHEET_DARK;
}

/** Input: transparent on sheet, hairline underline only */
export function appleProFieldClass(isLight: boolean, locked?: boolean) {
  return cn(
    "h-11 w-full border-0 border-b bg-transparent px-0 text-[16px] font-medium outline-none ring-0 focus:ring-0",
    isLight
      ? "border-black/15 text-[#1c1c1e] placeholder:text-slate-400"
      : "border-white/20 text-white placeholder:text-white/35",
    locked && "opacity-55",
  );
}

export function appleProSelectClass(isLight: boolean) {
  return cn(
    "h-11 w-full appearance-none border-0 border-b bg-transparent px-0 text-[16px] font-medium outline-none",
    isLight ? "border-black/15 text-[#1c1c1e]" : "border-white/20 text-white",
  );
}

export function appleProTextareaClass(isLight: boolean) {
  return cn(
    "min-h-[88px] w-full resize-none border-0 border-b bg-transparent px-0 py-2 text-[16px] font-medium leading-snug outline-none",
    isLight
      ? "border-black/15 text-[#1c1c1e] placeholder:text-slate-400"
      : "border-white/20 text-white placeholder:text-white/35",
  );
}
