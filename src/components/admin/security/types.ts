export type Tab =
  "overview" | "contact-changes" | "name-changes" | "fraud" | "audit";

export const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "contact-changes", label: "Contact Changes" },
  { key: "name-changes", label: "Name Changes" },
  { key: "fraud", label: "Fraud Review" },
  { key: "audit", label: "Audit Trail" },
];

export type AdminSection = Record<string, unknown>;
export type AdminRow = {
  id?: string;
  status?: string;
  userId?: string;
  referrerUserId?: string;
  referredUserId?: string;
  rewardAmount?: number;
  transactionType?: string;
  amount?: number;
  createdAt?: string;
  requestedAmount?: number;
  feeAmount?: number;
  netAmount?: number;
  key?: string;
  value?: unknown;
  changeType?: string;
  oldValue?: string;
  newValue?: string;
  riskScore?: number;
  currentName?: string;
  requestedName?: string;
  reason?: string;
  flagType?: string;
  riskLevel?: string;
  description?: string;
  adminName?: string;
  adminId?: string;
  actionType?: string;
  targetType?: string;
  targetId?: string;
};

export type FetchSection = (section: Tab, params?: string) => Promise<void>;
export type OnAction = (
  action: string,
  body: Record<string, unknown>,
) => Promise<void>;

export function sectionData(
  data: Record<string, unknown>,
  key: string,
): AdminSection {
  const v = data[key];
  return v && typeof v === "object" ? (v as AdminSection) : {};
}
export function rowsOf(section: AdminSection, key: string): AdminRow[] {
  const v = section[key];
  return Array.isArray(v) ? (v as AdminRow[]) : [];
}
export function statsOf(
  section: AdminSection,
): Record<string, string | number | undefined> {
  const v = section.stats;
  return v && typeof v === "object"
    ? (v as Record<string, string | number | undefined>)
    : {};
}

export const card =
  "rounded-xl border border-[var(--om-border)] bg-[var(--om-panel)] p-4";
export const badge = (cls: string) =>
  `inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`;
