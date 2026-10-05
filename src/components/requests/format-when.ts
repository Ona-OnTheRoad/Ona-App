function format(
  iso: string | null | undefined,
  opts: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    return new Date(t).toLocaleString(undefined, opts);
  } catch {
    return "";
  }
}

/** "Mar 3, 10:30 AM" */
export function formatWhenShort(iso: string | null | undefined): string {
  return format(iso, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Mar 3, 2026, 10:30 AM" */
export function formatWhenWithYear(iso: string | null | undefined): string {
  return format(iso, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Tue, Mar 3, 2026, 10:30 AM" */
export function formatWhenFull(iso: string | null | undefined): string {
  return format(iso, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
