/**
 * Plain-language wait for "try again in …" messages, from seconds.
 * 45 -> "45 seconds", 61 -> "about 2 minutes", 1502 -> "about 26 minutes",
 * 3600 -> "about 1 hour", 5400 -> "about 1 hour 30 minutes".
 * Rounds up, so the user never comes back too early.
 */
export function formatWait(totalSeconds: number): string {
  const sec = Math.max(1, Math.ceil(Number(totalSeconds) || 0));
  if (sec < 60) return sec === 1 ? "1 second" : `${sec} seconds`;
  const minutes = Math.ceil(sec / 60);
  if (minutes < 60) return minutes === 1 ? "about 1 minute" : `about ${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = hours === 1 ? "1 hour" : `${hours} hours`;
  if (rest === 0) return `about ${h}`;
  return `about ${h} ${rest === 1 ? "1 minute" : `${rest} minutes`}`;
}

/**
 * Compact live countdown or duration label, from seconds (no rounding up,
 * for values that tick every second): 45 -> "45s", 66 -> "1m 06s",
 * 3725 -> "1h 02m". Seconds stay seconds under a minute.
 */
export function formatClock(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (sec < 60) return `${sec}s`;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${pad(sec % 60)}s`;
  return `${Math.floor(sec / 3600)}h ${pad(Math.floor((sec % 3600) / 60))}m`;
}
