"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import Link from "next/link";
import { Star } from "lucide-react";

export type ReviewRow = {
  id: string;
  request_id: string;
  motorist_id: string;
  repair_pro_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

interface ReviewsTableProps {
  reviews: ReviewRow[];
}

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Reviews • {reviews.length}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <th className="px-6 py-3.5">When</th>
              <th className="px-6 py-3.5">Rating</th>
              <th className="px-6 py-3.5">Comment</th>
              <th className="px-6 py-3.5">Pro</th>
              <th className="px-6 py-3.5">Customers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <NoHistoryIllustration className="w-52 h-40 max-w-full" />
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                      No admin actions recorded yet.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-800 dark:text-gray-200 max-w-md">
                    {r.comment || "—"}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {r.repair_pro_id.slice(0, 8)}…
                  </td>
                  <td className="px-6 py-4 text-xs font-mono whitespace-nowrap">
                    <Link
                      href={`/admin/motorists/${r.motorist_id}`}
                      className="text-ona-brand hover:underline"
                    >
                      {r.motorist_id.slice(0, 8)}…
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

