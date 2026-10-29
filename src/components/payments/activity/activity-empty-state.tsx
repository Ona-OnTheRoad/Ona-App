"use client";

import Image from "next/image";

export function ActivityEmptyState() {
  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface shadow-xs dark:rounded-ona-sheet dark:border-[#333E4F] dark:bg-ona-bg dark:p-2.5 dark:shadow-none">
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-90 dark:rounded-ona-card dark:border dark:border-[#18181B] dark:bg-ona-surface dark:shadow-xs">
        <div className="relative w-44 h-44 mb-2">
          <Image
            src="/images/no-history.png"
            alt="No moves illustration"
            fill
            className="object-contain dark:grayscale"
            priority
          />
        </div>
        <h2 className="text-[16px] font-semibold text-ona-ink">
          No moves in this period
        </h2>
        <p className="mt-1 text-[12px] font-normal text-ona-muted max-w-xs">
          Try another range or status above.
        </p>
      </div>
    </div>
  );
}
