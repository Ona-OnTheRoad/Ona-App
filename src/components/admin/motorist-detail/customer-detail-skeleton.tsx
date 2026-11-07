"use client";

import Link from "next/link";

export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4 flex items-center gap-1.5 select-none">
        <Link
          href="/admin/motorists"
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Customers
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 dark:text-gray-200 font-medium">
          Customer profile
        </span>
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-2 mb-6">
        <div>
          <div className="h-7 w-56 bg-gray-200 dark:bg-[#27272a] rounded-lg animate-pulse" />
          <div className="h-4 w-80 sm:w-96 bg-gray-200 dark:bg-[#27272a] rounded-md animate-pulse mt-2" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-24 bg-gray-200 dark:bg-[#27272a] rounded-xl animate-pulse" />
          <div className="h-9 w-36 bg-gray-200 dark:bg-[#27272a] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Stat Cards Skeleton (4 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs"
          >
            <div className="h-3 w-16 bg-gray-200 dark:bg-[#27272a] rounded animate-pulse" />
            <div className="h-7 w-12 bg-gray-200 dark:bg-[#27272a] rounded-md animate-pulse mt-3" />
          </div>
        ))}
      </div>

      {/* Segmented Tabs Skeleton */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#18171c] border border-gray-200/80 dark:border-[#27272a] rounded-xl w-fit max-w-full overflow-x-auto mb-6">
        {[80, 140, 70, 75, 110].map((w, i) => (
          <div
            key={i}
            style={{ width: `${w}px` }}
            className="h-8 bg-gray-200/80 dark:bg-[#27272a] rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Main Content Skeleton (2 Column Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column Card */}
        <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272a]">
            <div className="h-5 w-24 bg-gray-200 dark:bg-[#27272a] rounded animate-pulse" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#27272a]">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="px-6 py-4">
                <div className="h-3 w-20 bg-gray-200 dark:bg-[#27272a] rounded animate-pulse" />
                <div className="h-4 w-44 bg-gray-200 dark:bg-[#27272a] rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Cards */}
        <div className="space-y-6">
          <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272a]">
              <div className="h-5 w-24 bg-gray-200 dark:bg-[#27272a] rounded animate-pulse" />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#27272a]">
              {[1, 2, 3].map((row) => (
                <div key={row} className="px-6 py-4">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-[#27272a] rounded animate-pulse" />
                  <div className="h-4 w-36 bg-gray-200 dark:bg-[#27272a] rounded mt-2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272a]">
              <div className="h-5 w-36 bg-gray-200 dark:bg-[#27272a] rounded animate-pulse" />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#27272a]">
              {[1, 2, 3].map((row) => (
                <div key={row} className="px-6 py-4">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-[#27272a] rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-200 dark:bg-[#27272a] rounded mt-2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

