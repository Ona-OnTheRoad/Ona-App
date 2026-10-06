export type CareStatus = {
  adminRole: string;
  roleLabel: string;
  fullName: string;
  email: string;
  sensitiveUnlocked?: boolean;
};

export type SearchHit = {
  kind: "user" | "job";
  id: string;
  title: string;
  subtitle: string;
};

export type BoardJob = {
  id: string;
  flow_status?: string;
  status?: string;
  motorist_name?: string;
  repair_pro_name?: string;
  pickup_address?: string;
  agreed_major?: number;
  service_type?: string;
  escrow_status?: string;
  eta_text?: string;
  updated_at?: string;
};

export type Board = {
  jobs: BoardJob[];
  byStatus: Record<string, number>;
  disputedCount: number;
  appealCount: number;
  platformFeePercent: number;
};

export type DashboardTotals = {
  users: number;
  motorists: number;
  repairPros: number;
  pendingPros: number;
  openJobs: number;
  completedJobs: number;
  revenueNgn: number;
};
