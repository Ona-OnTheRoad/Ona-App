export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  password?: boolean;
  icon?: string;
};
export type NavGroup = { label: string; items: NavItem[] };

/**
 * Control centre navigation.
 * 🔒 routes open a password popup before navigation.
 * Groups filtered by staff role (Super Admin / Care / Support).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", exact: true, icon: "LayoutGrid" },
      { href: "/admin/dispatch", label: "Dispatch board", icon: "Truck" },
      { href: "/admin/jobs", label: "Live jobs", icon: "Briefcase" },
      { href: "/admin/disputes", label: "Disputes & appeals", icon: "Scale" },
      {
        href: "/admin/payments/control-center",
        label: "Payment Control Center",
        icon: "CreditCard",
      },
      { href: "/admin/shop", label: "Shop orders & delivery", icon: "Package" },
      { href: "/admin/security", label: "Security", icon: "ShieldCheck" },
      { href: "/admin/deletion-requests", label: "Deletion requests", icon: "UserX" },
      { href: "/admin/credit-control", label: "Credit Control", icon: "Coins" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/motorists", label: "Customers", icon: "User" },
      { href: "/admin/pros", label: "Repair Pros", icon: "Wrench" },
      { href: "/admin/verification", label: "Verification board", icon: "ShieldCheck" },
      { href: "/admin/accounts", label: "Accounts & sync", icon: "RefreshCw" },
      { href: "/admin/users", label: "All users", icon: "Users" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/admin/messages", label: "Messages", icon: "MessageSquare" },
      { href: "/admin/reviews", label: "Reviews", icon: "Star" },
      { href: "/admin/signups", label: "Signups", icon: "UserPlus" },
      { href: "/admin/audit", label: "Audit trail", icon: "Clock" },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/admin/settings",
        label: "System settings 🔒",
        icon: "Settings",
        password: true,
      },
    ],
  },
];
