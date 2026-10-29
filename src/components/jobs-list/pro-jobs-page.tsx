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
    <div className="ona2 relative flex h-full min-h-0 flex-col bg-ona-bg text-ona-ink">
      {/* Top Header */}
      <header className="px-5 pt-4 pb-2 shrink-0">
        <h1 className="text-2xl font-bold dark:text-[20px] dark:font-semibold tracking-tight text-ona-ink">
          Jobs
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide flex flex-col">
        {loading && (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        )}
        {err && (
          <p className="mb-3 text-center text-xs font-semibold text-red-500">
            {err}
          </p>
        )}

        {/* Past job rows or Figma Empty State */}
        {!loading &&
          (past.length === 0 ? (
            <div className="flex-1 flex flex-col py-2">
              <ProEmptyState
                title="No Jobs yet"
                subtitle="Finished and cancelled jobs will appear here."
                className="flex-1 h-full min-h-115"
              />
            </div>
          ) : (
            <ul className="space-y-0 pt-2">
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
          ))}
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
