import type { ExpressTheme } from "./types";

export function naira(major: number): string {
  return `₦${Math.round(major).toLocaleString("en-NG")}`;
}

export function localDateStr(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function canAdvance(value: string): boolean {
  return value.trim().length > 2;
}

export function actionFlat(isLight: boolean): string {
  return isLight ? "text-slate-700" : "text-white/85";
}

export function expressTheme(isLight: boolean): ExpressTheme {
  return {
    isLight,
    ink: isLight ? "text-slate-900" : "text-white",
    muted: isLight ? "text-slate-500" : "text-white/50",
    rowCard: isLight ? "bg-black/[0.02]" : "bg-white/[0.02]",
    field: isLight
      ? "bg-transparent text-slate-900 placeholder:text-slate-400"
      : "bg-transparent text-white placeholder:text-white/40",
  };
}

/** Pin an Express action block to the bottom of the step container. */
export const PINNED_BOTTOM = "absolute inset-x-3 bottom-2";

export const PRIMARY_BTN =
  "h-11 w-full rounded-md border-0 bg-brand text-[14px] font-bold text-white";
