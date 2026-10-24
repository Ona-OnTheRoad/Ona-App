"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { ProEmptyState } from "@/components/dashboard/pro-empty-state";
import { JOB_CLOSED_MESSAGE } from "@/lib/chat-expired";
import { ProPastJobRow } from "./pro-past-job-row";
import { useProPastJobs } from "./use-pro-past-jobs";

/** Menu → Jobs for Repair Pro: past jobs with full detail links */
export function ProJobsPage({
  isLight,
  backendUserId,
}: {
  isLight: boolean;
  backendUserId: string | null | undefined;
}) {
  const router = useRouter();
  const { past, loading, err } = useProPastJobs(backendUserId);
  const [closedOpen, setClosedOpen] = useState(false);
  const [viewHref, setViewHref] = useState<string | null>(null);

  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-white/70";

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white dark:bg-[#121316]">
      {/* Top Header */}
      <header className="px-5 pt-4 pb-2 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Jobs
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
          </div>
        )}
        {err && (
          <p className="mb-3 text-center text-xs font-semibold text-red-500">
            {err}
          </p>
        )}

        {/* Past job rows or Figma Empty State */}
        {!loading && (
          <section className="pt-2">
            {past.length === 0 ? (
              <ProEmptyState
                title="No Jobs yet"
                subtitle="Finished and cancelled jobs will appear here."
                minHeight="min-h-[400px]"
              />
            ) : (
              <ul className="space-y-0">
                {past.map((j) => (
                  <ProPastJobRow
                    key={j.id}
                    j={j}
                    ink={ink}
                    muted={muted}
                    isLight={isLight}
                    onOpen={(href) => {
                      setViewHref(href);
                      setClosedOpen(true);
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <ExpiredDialog
        open={closedOpen}
        isLight={isLight}
        message={JOB_CLOSED_MESSAGE}
        onClose={() => {
          setClosedOpen(false);
          setViewHref(null);
        }}
        onView={
          viewHref
            ? () => {
                const href = viewHref;
                setClosedOpen(false);
                setViewHref(null);
                router.push(href);
              }
            : undefined
        }
      />
    </div>
  );
}
