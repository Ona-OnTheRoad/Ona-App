export function fmtClock(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour12: false });
}

export function fmtLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, "0")}`;
}
