export type StatusFilter = "all" | "active" | "released" | "refunded";
export type DateFilter = "1d" | "3d" | "7d" | "1m" | "2m" | "3m" | "4m" | "5m";

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
    case "2m":
      start.setMonth(start.getMonth() - 2);
      return start.getTime();
    case "3m":
      start.setMonth(start.getMonth() - 3);
      return start.getTime();
    case "4m":
      start.setMonth(start.getMonth() - 4);
      return start.getTime();
    case "5m":
      start.setMonth(start.getMonth() - 5);
      return start.getTime();
    default:
      return 0;
  }
}

export const DATE_CHIPS: { key: DateFilter; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "3d", label: "3D" },
  { key: "7d", label: "7D" },
  { key: "1m", label: "1M" },
  { key: "2m", label: "2M" },
  { key: "3m", label: "3M" },
  { key: "4m", label: "4M" },
  { key: "5m", label: "5M" },
];
