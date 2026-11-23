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
