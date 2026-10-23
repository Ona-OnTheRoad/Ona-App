export function formatWhen(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    return new Date(t).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** Matches Figma notification designs: "Aug 28 · 22:58". */
export function formatNotificationDate(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    const d = new Date(t);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${month} ${day} · ${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/** Compact X-style time label for the list: "Ona · now / 5m / 2h / Jan 3 2:31 PM". */
export function toastWhen(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.floor((now - t) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return formatWhen(iso);
}
