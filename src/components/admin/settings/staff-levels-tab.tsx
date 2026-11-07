"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import {
  LEVEL_GUIDE,
  LEVEL_OPTIONS,
  type StaffRow,
} from "@/components/admin/staff/levels";

interface StaffLevelsTabProps {
  staff: StaffRow[];
  assignable: string[];
  actorRole: string | null;
  busyId: string | null;
  onSetLevel: (userId: string, nextRole: string) => Promise<void>;
}

export function StaffLevelsTab({
  staff,
  assignable,
  actorRole,
  busyId,
  onSetLevel,
}: StaffLevelsTabProps) {
  const counts = LEVEL_GUIDE.map((l) => ({
    ...l,
    count: staff.filter((s) => s.adminRole === l.value).length,
  }));

  const dropdownOptions =
    actorRole === "super_admin" || assignable.length >= 5
      ? LEVEL_OPTIONS
      : LEVEL_OPTIONS.filter(
          (o) =>
            assignable.includes(o.value) ||
            staff.some((s) => s.adminRole === o.value),
        );

  const cardStyles = [
    {
      bg: "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40",
      labelColor: "text-emerald-700 dark:text-emerald-400",
      titleColor: "text-emerald-900 dark:text-emerald-300",
    },
    {
      bg: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40",
      labelColor: "text-amber-700 dark:text-amber-400",
      titleColor: "text-amber-900 dark:text-amber-300",
    },
    {
      bg: "bg-purple-50/60 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/40",
      labelColor: "text-purple-700 dark:text-purple-400",
      titleColor: "text-purple-900 dark:text-purple-300",
    },
    {
      bg: "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40",
      labelColor: "text-rose-700 dark:text-rose-400",
      titleColor: "text-rose-900 dark:text-rose-300",
    },
    {
      bg: "bg-gray-50/80 dark:bg-[#18171c] border-gray-200 dark:border-white/5",
      labelColor: "text-gray-600 dark:text-gray-400",
      titleColor: "text-gray-900 dark:text-white",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Staff access levels
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Ona staff uses five fixed levels. Everyone who can open the admin panel must have profiles.role = admin and an admin_role of L1-L5 below.
        </p>
      </div>

      {/* 5 Level Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 mb-6">
        {counts.map((c, i) => {
          const style = cardStyles[i] || cardStyles[4];
          return (
            <div
              key={c.value}
              className={`p-4 rounded-2xl border ${style.bg} shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${style.labelColor}`}>
                  LEVEL {c.level}
                </div>
                <div className={`text-sm font-bold mt-1 ${style.titleColor}`}>
                  {c.label}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mt-1.5">
                  {c.count} staff
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                {c.blurb}
              </p>
            </div>
          );
        })}
      </div>

      {/* Staff Accounts Table Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Staff accounts
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Level</th>
                <th className="px-6 py-3.5">Active</th>
                <th className="px-6 py-3.5">Change Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <NoHistoryIllustration className="w-52 h-40 max-w-full" />
                      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                        No staff accounts found.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-medium text-gray-900 dark:text-white">
                      {s.fullName || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {s.email}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                        {s.roleLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.isActive
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-gray-200 dark:bg-white/10 text-gray-500"
                        }`}
                      >
                        {s.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <select
                        disabled={
                          busyId === s.id ||
                          (assignable.length === 0 && actorRole !== "super_admin")
                        }
                        value={s.adminRole}
                        onChange={(e) => void onSetLevel(s.id, e.target.value)}
                        className="bg-gray-50 dark:bg-[#18171c] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 cursor-pointer disabled:opacity-50"
                      >
                        {dropdownOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
