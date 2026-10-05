export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  password?: boolean;
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
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/dispatch", label: "Dispatch board" },
      { href: "/admin/jobs", label: "Live jobs" },
      { href: "/admin/disputes", label: "Disputes & appeals" },
      {
        href: "/admin/payments/control-center",
        label: "Payment Control Center",
      },
      { href: "/admin/shop", label: "Shop orders & delivery" },
      { href: "/admin/security", label: "Security" },
      { href: "/admin/deletion-requests", label: "Deletion Requests" },
      { href: "/admin/credit-control", label: "Credit Control" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/motorists", label: "Customers" },
      { href: "/admin/pros", label: "Repair Pros" },
      { href: "/admin/accounts", label: "Accounts & sync" },
      { href: "/admin/users", label: "All users" },
      { href: "/admin/verification", label: "Verification overview" },
    ],
  },
  {
    label: "Care tools",
    items: [
      { href: "/admin/customer-review", label: "Customer ID review" },
      { href: "/admin/pro-review", label: "Pro ID review" },
      { href: "/admin/verification", label: "Verification board" },
      { href: "/admin/health", label: "Service health" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/signups", label: "Signups" },
      { href: "/admin/audit", label: "Audit trail" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/health", label: "Health" },
      { href: "/admin/staff", label: "Staff levels 🔒", password: true },
      { href: "/admin/settings", label: "Settings 🔒", password: true },
      { href: "/admin/features", label: "Features 🔒", password: true },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/matching", label: "Matching" },
      { href: "/admin/content", label: "Content & menus" },
    ],
  },
];
