"use client";

import { cn } from "@/lib/utils";

interface CustomerStatCardsProps {
  isActive: boolean;
  jobsCount: number;
  bookingsCount: number;
  paymentsCount: number;
}

export function CustomerStatCards({
  isActive,
  jobsCount,
  bookingsCount,
  paymentsCount,
}: CustomerStatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Status Card */}
      <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
          STATUS
        </span>
        <div className="mt-2">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize",
              isActive
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Jobs Card */}
      <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
          JOBS
        </span>
        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {jobsCount}
        </span>
      </div>

      {/* Bookings Card */}
      <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
          BOOKINGS
        </span>
        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {bookingsCount}
        </span>
      </div>

      {/* Payments Card */}
      <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
          PAYMENTS
        </span>
        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {paymentsCount}
        </span>
      </div>
    </div>
  );
}

