"use client";

import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { JobsPagination } from "@/components/admin/jobs/jobs-pagination";

export type CustomerItem = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string;
  is_active: boolean;
};

interface CustomersTableProps {
  customers: CustomerItem[];
  loading: boolean;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CustomersTable({
  customers,
  loading,
  onRefresh,
  currentPage,
  totalPages,
  onPageChange,
}: CustomersTableProps) {
  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Header toolbar */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          All Customers
        </h2>
        <button
          type="button"
          disabled={loading}
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table / Empty State / Loading State */}
      {loading && customers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-ona-brand mb-3" />
          <span>Loading customers…</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No customers found.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
            Registered customer accounts will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-190 border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold w-[32%]">Name/Email</th>
                <th className="py-3 px-4 font-semibold w-[22%]">Contact</th>
                <th className="py-3 px-4 font-semibold w-[24%]">Location</th>
                <th className="py-3 px-4 font-semibold w-[12%]">Status</th>
                <th className="py-3 pl-4 pr-6 font-semibold w-[10%] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="font-semibold text-gray-900 dark:text-white text-xs">
                      {c.full_name || "Unnamed Customer"}
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">
                      {c.email || "—"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200 font-mono text-[11px]">
                    {c.phone || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                    {c.location || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full capitalize",
                        c.is_active
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
                      )}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right">
                    <Link
                      href={`/admin/motorists/${c.id}`}
                      className="text-xs font-semibold text-ona-brand hover:text-[#e0482b] hover:underline transition-colors"
                    >
                      View user
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {customers.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#27272a]">
          <JobsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

