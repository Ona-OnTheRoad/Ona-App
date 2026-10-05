import type { FlowStyles } from "./types";

/** Theme-dependent class tokens shared by every help-flow view. */
export function flowStyles(isLight: boolean): FlowStyles {
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-white/50";
  const field = isLight
    ? "bg-transparent text-slate-900 placeholder:text-slate-400"
    : "bg-transparent text-white placeholder:text-white/40";
  const rowCard = isLight ? "bg-black/[0.02]" : "bg-white/[0.02]";
  const actionFlat = isLight ? "text-slate-700" : "text-white/85";
  const chipIdle = isLight
    ? "bg-black/8 text-slate-700"
    : "bg-[#2c2c2e] text-white/75";
  return { ink, muted, field, rowCard, actionFlat, chipIdle };
}
