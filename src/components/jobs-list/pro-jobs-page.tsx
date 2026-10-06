import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { JOB_CLOSED_MESSAGE } from "@/lib/chat-expired";
import { cn } from "@/lib/utils";
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

  const stage = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-700" : "text-white/75";

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", stage)}>
      <PageHeader title="Jobs" backHref="/dashboard" />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
          </div>
        )}
        {err && (
          <p className="mb-3 text-center text-[12px] font-semibold text-red-500">
            {err}
          </p>
        )}

        {/* Past job rows open full process on /requests/[id] */}
        {!loading && (
          <section>
            {past.length === 0 ? (
              <p
                className={cn(
                  "py-10 text-center text-[14px] font-semibold",
                  muted,
                )}
              >
                No jobs yet
              </p>
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
