export type StaffRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  adminRole: string;
  roleLabel: string;
  isActive: boolean;
};

/** Full L1-L5 ladder always visible so operators can see every level */
export const LEVEL_GUIDE: {
  value: string;
  level: number;
  label: string;
  blurb: string;
  color: string;
  soft: string;
}[] = [
  {
    value: "customer_care",
    level: 1,
    label: "Customer Care",
    blurb: "Jobs, users, verification, simple issues",
    color: "#0f766e",
    soft: "#ccfbf1",
  },
  {
    value: "senior_support",
    level: 2,
    label: "Senior Support",
    blurb: "Disputes, freezes, payment status",
    color: "#1d4ed8",
    soft: "#dbeafe",
  },
  {
    value: "operations",
    level: 3,
    label: "Operations / Finance",
    blurb: "Escrow release/refund, full payments, banks",
    color: "#b45309",
    soft: "#fef3c7",
  },
  {
    value: "manager",
    level: 4,
    label: "Manager",
    blurb: "Content + assign L1-L3 staff",
    color: "#6d28d9",
    soft: "#ede9fe",
  },
  {
    value: "super_admin",
    level: 5,
    label: "Super Admin",
    blurb: "Owner · all settings · assign L1-L5",
    color: "#1a1b1e",
    soft: "#e5e7eb",
  },
];

export const LEVEL_OPTIONS = LEVEL_GUIDE.map((l) => ({
  value: l.value,
  label: `L${l.level} · ${l.label}`,
}));
