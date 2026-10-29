"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

export default function SettingsAvailabilitySectionPage() {
  const router = useRouter();
  const { accountType } = useApp();

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 pt-3">
        {/* Back arrow */}
        <div className="flex items-center mb-3">
          <button
            type="button"
            onClick={() => navigateBack(router, "/profile", accountType)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Back to Profile"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Screen Title */}
        <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink mb-6">
          Availability & Scheduling
        </h1>

        {/* Card with 2 Rows */}
        <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent divide-y divide-ona-border dark:divide-[#18181B] overflow-hidden shadow-2xs">
          {/* Row 1: Hours & vacation */}
          <div
            onClick={() => router.push("/settings/availability")}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/1 dark:hover:bg-white/2 transition-colors"
          >
            <div>
              <p className="text-[13px] font-bold text-ona-ink">
                Hours & vacation
              </p>
              <p className="text-[11px] text-ona-muted mt-0.5">
                Schedule, time off, Live pause
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-ona-muted" strokeWidth={2} />
          </div>

          {/* Row 2: Service area */}
          <div
            onClick={() => router.push("/settings/location")}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/1 dark:hover:bg-white/2 transition-colors"
          >
            <div>
              <p className="text-[13px] font-bold text-ona-ink">
                Service area
              </p>
              <p className="text-[11px] text-ona-muted mt-0.5">
                Coverage radius & location
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-ona-muted" strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
