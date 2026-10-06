export type StatusFilter = "all" | "active" | "released" | "refunded";
export type DateFilter = "1d" | "3d" | "7d" | "1m" | "3m" | "6m" | "1y" | "ytd";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Earliest timestamp for a period filter (inclusive). */
export function periodStartMs(filter: DateFilter): number {
  const now = new Date();
  const start = startOfDay(now);

  switch (filter) {
    case "1d":
      return start.getTime();
    case "3d":
      start.setDate(start.getDate() - 2);
      return start.getTime();
    case "7d":
      start.setDate(start.getDate() - 6);
      return start.getTime();
    case "1m":
      start.setMonth(start.getMonth() - 1);
      return start.getTime();
    case "3m":
      start.setMonth(start.getMonth() - 3);
      return start.getTime();
    case "6m":
      start.setMonth(start.getMonth() - 6);
      return start.getTime();
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      return start.getTime();
    case "ytd":
      return new Date(now.getFullYear(), 0, 1).getTime();
    default:
      return 0;
  }
}

export function periodLabel(filter: DateFilter): string {
  switch (filter) {
    case "1d":
      return "Today";
    case "3d":
      return "Last 3 days";
    case "7d":
      return "Last 7 days";
    case "1m":
      return "Last month";
    case "3m":
      return "Last 3 months";
    case "6m":
      return "Last 6 months";
    case "1y":
      return "Last year";
    case "ytd":
      return "Year to date";
    default:
      return "";
  }
}

export const DATE_CHIPS: { key: DateFilter; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "3d", label: "3D" },
  { key: "7d", label: "7D" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "ytd", label: "YTD" },
];
