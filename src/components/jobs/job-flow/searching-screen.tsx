"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minimize2 } from "lucide-react";
import { JobShell } from "@/components/jobs/job-shell";
import { OnaRadar, type OnaRadarDot } from "@/components/ui/ona-radar";
import { useApp } from "@/lib/store";
import { cancelSearchRequest } from "./cancel-search";
import { apiPairingSweep } from "@/lib/jobs/client";
import { BROADCAST_TIERS, broadcastStartedAtMs } from "@/lib/jobs/broadcast-tiers";
import { useExactCountdown } from "@/lib/jobs/use-exact-countdown";
import { secondsLeftFloor } from "@/lib/jobs/countdown-math";
import { serverNow } from "@/lib/jobs/server-clock";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";
import { SEARCH_REROUTE_WINDOW_MS } from "./job-utils";
import { isProPlaceholderName } from "@/lib/pro-label";

/** Display-only chip for the server pairing deadline (no per-second announcements). */
function PairingChip({ endsAt }: { endsAt: string }) {
  useExactCountdown(endsAt);
  const sec = Math.max(
    0,
    secondsLeftFloor(new Date(endsAt).getTime(), serverNow()),
  );
  const mm = Math.floor(sec / 60);
  const ss = String(sec % 60).padStart(2, "0");
  return (
    <span
      role="timer"
      aria-label={`Time left for this pro ${mm} minutes ${ss} seconds`}
      className="inline-flex min-h-7 items-center rounded-full border border-white/70 px-3 text-[12px] font-medium tabular-nums text-ona-on-dark"
    >
      {mm}:{ss}
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
    !!job.repairProName && !isProPlaceholderName(job.repairProName);
  const parts = (job.repairProName || "").trim().split(/\s+/);
  const proName = proKnown
    ? parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
      : parts[0]
    : "";
  const { visibleTechnicians } = useApp();
  const dots = useMemo<OnaRadarDot[]>(() => {
    const out: OnaRadarDot[] = [];
    if (proKnown) {
      out.push({
        id: job.repairProId || "requested",
        name: job.repairProName,
        photoUrl: job.repairProPhoto,
        highlight: true,
      });
    }
    visibleTechnicians
      .filter(
        (t) => t.id !== job.repairProId && t.serviceType === job.serviceType,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3)
      .forEach((t) =>
        out.push({ id: t.id, name: t.name, photoUrl: t.photo || null }),
      );
    return out;
  }, [
    visibleTechnicians,
    proKnown,
    job.repairProId,
    job.repairProName,
    job.repairProPhoto,
    job.serviceType,
  ]);
  const distance =
    typeof job.distanceKm === "number" && job.distanceKm > 0
      ? `${job.distanceKm.toFixed(1)} km away`
      : null;
  const requesting = proName
    ? `Requesting ${proName}${distance ? ` · ${distance}` : ""}`
    : `Looking for the nearest ${skillLabel}`;

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const cancelSearch = useCallback(
    async (auto: boolean) => {
      // Pending (/jobs/new) has no server job yet just go home, no CANCEL.
      if (job.id.startsWith("pending-")) {
        router.replace("/");
        return;
      }
      // Wait for the server to confirm. Leaving first and cancelling in the
      // background left a cancelled search on the home screen as a request the
      // customer could still resume whenever the CANCEL call failed or lagged.
      setCancelling(true);
      setCancelError(null);
      const res = await cancelSearchRequest({
        jobId: job.id,
        motoristId: job.motoristId,
      });
      if (res.ok || auto) {
        router.replace(auto ? `/requests/${job.id}` : "/");
        return;
      }
      setCancelling(false);
      setCancelError(res.message);
    },
    [job.id, job.motoristId, router],
  );

  // Drive the broadcast from the customer's open screen: nudge the server when
  // each distance tier opens (so pros in the next ring get their push) and when
  // the window ends with no taker (so the search expires and Retry appears).
  // Server-side sweeps still own the truth; this just removes the wait on a cron.
  useEffect(() => {
    if (job.id.startsWith("pending-")) return;
    const sweep = () => {
      void apiPairingSweep({ source: "job-screen", trigger: "maintenance" }).catch(() => undefined);
    };
    const startedAt = broadcastStartedAtMs(job.statusHistory, job.createdAt) ?? Date.now();
    const timers: number[] = [];
    for (const tier of BROADCAST_TIERS) {
      const delay = startedAt + tier.afterMs - Date.now();
      if (tier.afterMs > 0 && delay > -500) timers.push(window.setTimeout(sweep, Math.max(0, delay) + 600));
    }
    if (job.pairingDeadline) {
      const delay = Date.parse(job.pairingDeadline) - Date.now();
      if (Number.isFinite(delay) && delay > -500) timers.push(window.setTimeout(sweep, Math.max(0, delay) + 600));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [job.id, job.createdAt, job.statusHistory, job.pairingDeadline]);

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
          <span className="inline-flex rounded-full border border-ona-brand bg-[#fdeeea] px-3 py-1.5 text-[12px] font-medium leading-none text-[#3a1710]">
            Nearest pros first
          </span>
          <h1 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
            Finding your nearest {skillLabel.toLowerCase()}
          </h1>
          <p className="mt-2 max-w-[300px] text-[13px] leading-snug text-ona-on-dark-muted">
            Verified pros near you are alerted, closest first. The first to
            accept takes your job, so you get a committed response, not a
            bidding crowd.
          </p>
        </div>
        <div className="my-4 flex flex-1 items-center justify-center">
          <OnaRadar dots={dots} />
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 text-center">
          {job.pairingDeadline ? (
            <PairingChip endsAt={job.pairingDeadline} />
          ) : null}
          <div role="status" aria-live="polite" className="space-y-1">
            <p className="text-[14px]">{requesting}</p>
            {nearbyLine ? <p className="sr-only">{nearbyLine}</p> : null}
          </div>
          <p className="text-[12px] text-ona-on-dark-muted">
            Widening the search automatically if nobody is free yet
          </p>
        </div>
      </div>
      <div className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
        <button
          type="button"
          onClick={() => void handleCancelSearch()}
          disabled={cancelling}
          className="flex h-12 w-full items-center justify-center rounded-ona-ctl border-0 bg-transparent text-[16px] font-medium text-white active:bg-white/10 disabled:opacity-60"
        >
          {cancelling ? "Cancelling…" : "Cancel search"}
        </button>
        {cancelError ? (
          <p role="alert" className="mt-1 text-center text-[13px] text-red-300">
            {cancelError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
