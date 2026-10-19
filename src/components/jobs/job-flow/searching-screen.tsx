"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Minimize2 } from "lucide-react";
import { JobShell } from "@/components/jobs/job-shell";
import { OnaRadar } from "@/components/ui/ona-radar";
import { apiTransition } from "@/lib/jobs/client";
import { useExactCountdown } from "@/lib/jobs/use-exact-countdown";
import { secondsLeftFloor } from "@/lib/jobs/countdown-math";
import { serverNow } from "@/lib/jobs/server-clock";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn, firstNameOnly } from "@/lib/utils";
import { SEARCH_REROUTE_WINDOW_MS } from "./job-utils";

/** Display-only chip for the server pairing deadline (no per-second announcements). */
function PairingChip({ endsAt }: { endsAt: string }) {
  useExactCountdown(endsAt);
  const sec = Math.max(
    0,
    secondsLeftFloor(new Date(endsAt).getTime(), serverNow()),
  );
  return (
    <span
      role="timer"
      aria-label={`Time left for this pro ${sec} seconds`}
      className="inline-flex min-h-7 items-center rounded-full border border-white/25 bg-white/10 px-3 text-[12px] font-semibold tabular-nums text-ona-on-dark"
    >
      {sec}s
    </span>
  );
}

export function SearchingScreen({
  job,
  viewer,
  isLight,
  onBack,
  nearbyLine,
}: {
  job: JobRecord;
  viewer: "motorist" | "repair_pro";
  backendUserId?: string | null;
  isLight: boolean;
  onBack: () => void;
  /** e.g. "2 Mechanics are near you" under the search feedback */
  nearbyLine?: string | null;
}) {
  const router = useRouter();
  const muted = isLight ? "text-slate-700" : "text-white/75";
  const skillLabel =
    (PRO_SERVICE_LABELS[job.serviceType] || "Pro")
      .replace(/\s*Pro$/i, "")
      .trim() || "Pro";
  const proKnown =
    !!job.repairProName && job.repairProName.trim() !== "Repair Pro";
  const proName = proKnown ? firstNameOnly(job.repairProName, "") : "";
  const distance =
    typeof job.distanceKm === "number" && job.distanceKm > 0
      ? `${job.distanceKm.toFixed(1)} km away`
      : null;
  const requesting = proName
    ? `Requesting ${proName}${distance ? ` · ${distance}` : ""}`
    : `Looking for the nearest ${skillLabel}`;

  const cancelSearch = useCallback(
    (auto: boolean) => {
      // Pending (/jobs/new) has no server job yet just go home, no CANCEL.
      if (job.id.startsWith("pending-")) {
        router.replace("/");
        return;
      }
      // Navigate first no hang waiting on CANCEL network
      router.replace(auto ? `/requests/${job.id}` : "/");
      void apiTransition({
        jobId: job.id,
        event: "CANCEL",
        actor: "motorist",
        actorId: job.motoristId,
        reason: "motorist_cancelled_search",
      }).catch(() => {
        /* ignore */
      });
    },
    [job.id, job.motoristId, router],
  );

  // Manual cancel (user-initiated) go home.
  const handleCancelSearch = useCallback(
    () => void cancelSearch(false),
    [cancelSearch],
  );

  // 3-minute auto-cancel timer → auto-close: customer to job details page.
  useEffect(() => {
    const t = window.setTimeout(
      () => void cancelSearch(true),
      SEARCH_REROUTE_WINDOW_MS,
    );
    return () => window.clearTimeout(t);
  }, [cancelSearch]);

  // Pro never uses this full-page searching UI for requests panel only
  if (viewer === "repair_pro") {
    router.replace("/dashboard");
    return (
      <JobShell isLight={isLight} title="Service Request" compactHeader>
        <p
          className={cn(
            "px-0.5 pt-8 text-center text-[13px] font-medium",
            muted,
          )}
        >
          Opening dashboard…
        </p>
      </JobShell>
    );
  }

  return (
    <div className="ona2 relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-ona-dark text-ona-on-dark">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] scrollbar-hide">
        <div className="flex shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to my requests"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-ona-on-dark"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex rounded-full border border-ona-brand/50 bg-ona-brand/20 px-3 py-1 text-[11px] font-semibold leading-none text-[#ffc2b3]">
            Sequential dispatch
          </span>
          <h1 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
            Finding your nearest {skillLabel.toLowerCase()}
          </h1>
          <p className="mt-2 max-w-[300px] text-[13px] leading-snug text-ona-on-dark-muted">
            We contact one verified pro at a time so you get a committed
            response, not a bidding crowd.
          </p>
        </div>
        <div className="my-4 flex flex-1 items-center justify-center">
          <OnaRadar
            photoUrl={proKnown ? job.repairProPhoto : null}
            name={job.repairProName}
          />
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 text-center">
          {job.pairingDeadline ? (
            <PairingChip endsAt={job.pairingDeadline} />
          ) : null}
          <div role="status" aria-live="polite" className="space-y-1">
            <p className="text-[14px] font-semibold">{requesting}</p>
            {nearbyLine ? (
              <p className="text-[12px] text-ona-on-dark-muted">{nearbyLine}</p>
            ) : null}
          </div>
          <p className="text-[12px] text-ona-on-dark-muted">
            Auto-moving to the next pro if unavailable
          </p>
        </div>
      </div>
      <div className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
        <button
          type="button"
          onClick={() => void handleCancelSearch()}
          className="flex h-12 w-full items-center justify-center rounded-ona-ctl border-0 bg-transparent text-[15px] font-semibold text-ona-on-dark underline-offset-4 active:bg-white/10"
        >
          Cancel search
        </button>
      </div>
    </div>
  );
}
