import Link from "next/link";
import type { Board, DashboardTotals } from "./types";

export function TotalsCards({
  dash,
  board,
}: {
  dash: DashboardTotals | null;
  board: Board | null;
}) {
  return (
    <div className="om-admin-cards">
      {(
        [
          ["Users", dash?.users, "/admin/users"],
          ["Customers", dash?.motorists, "/admin/motorists"],
          ["Repair Pros", dash?.repairPros, "/admin/pros"],
          ["Pending Pros", dash?.pendingPros, "/admin/pros"],
          ["Open jobs", dash?.openJobs ?? board?.jobs.length, "/admin/jobs"],
          ["Completed", dash?.completedJobs, "/admin/jobs"],
          [
            "Revenue (₦)",
            dash != null ? dash.revenueNgn.toLocaleString() : undefined,
            "/admin/payments",
          ],
          ["Disputes", board?.disputedCount, "/admin/disputes"],
        ] as const
      ).map(([label, value, href]) => (
        <div className="om-admin-card" key={label}>
          <Link href={href}>
            <div className="label">{label}</div>
            <div className="value">{value ?? "…"}</div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export function LiveOpsCards({ board }: { board: Board | null }) {
  return (
    <div className="om-admin-cards">
      {(
        [
          ["Live board", board?.jobs.length],
          ["Appeals", board?.appealCount],
          ["En route", board?.byStatus?.en_route],
          ["In progress", board?.byStatus?.in_progress],
          ["Paid/booked", board?.byStatus?.paid_booked],
          ["Negotiating", board?.byStatus?.negotiating],
        ] as const
      ).map(([label, value]) => (
        <div className="om-admin-card" key={label}>
          <div className="label">{label}</div>
          <div className="value">{value ?? "…"}</div>
        </div>
      ))}
    </div>
  );
}
