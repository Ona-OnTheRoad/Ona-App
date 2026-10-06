export type MergeCandidate = {
  id: string;
  primary_user_id: string;
  duplicate_user_id: string;
  primary_name: string;
  primary_email: string | null;
  duplicate_name: string;
  duplicate_email: string | null;
  match_reason: string;
  match_detail: Record<string, unknown>;
  created_at: string;
};

export type SyncEvent = {
  id: string;
  user_id: string | null;
  action: string;
  result: string;
  error: string | null;
  created_at: string;
};

export type Board = {
  summary: {
    motoristOnly: number;
    proOnly: number;
    dual: number;
    total: number;
    needsSync: number;
    pendingMerges: number;
  };
  merges: MergeCandidate[];
  syncLog: SyncEvent[];
};

export function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { hour12: false });
}

const MATCH_LABELS: Record<string, string> = {
  nin_last4: "NIN (last 4)",
  bvn_last4: "BVN (last 4)",
  drivers_licence: "Driver's licence number",
  passport: "International passport number",
};

export const SIGNAL_LABELS: Record<string, string> = {
  nin: "NIN last 4",
  bvn: "BVN last 4",
  drivers_licence: "Driver's licence",
  passport: "International passport",
};

export function matchReasonLabel(reason: string): string {
  return MATCH_LABELS[reason] || reason.replace(/_/g, " ");
}
