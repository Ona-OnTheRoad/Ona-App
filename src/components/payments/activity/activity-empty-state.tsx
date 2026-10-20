"use client";

import Image from "next/image";

export function ActivityEmptyState() {
  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-8 text-center flex flex-col items-center justify-center min-h-[360px] shadow-xs">
      <div className="relative w-44 h-44 mb-2">
        <Image
          src="/images/no-history.png"
          alt="No moves illustration"
          fill
          className="object-contain"
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
  );
}
