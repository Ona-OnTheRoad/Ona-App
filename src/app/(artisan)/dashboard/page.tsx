"use client";

/**
 * Pro dashboard Uber-style list under Live (no section titles):
 * - Incoming: Service Request only, real meet address (never “Current location”)
 * - Recent: Uber place + area only (never problem text / demo address)
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { BankForcePanel } from "@/components/auth/bank-force-panel";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerModeShell } from "@/components/dashboard/customer-mode-shell";
import {
  liveAwayButtonLabel,
  skillDashboardTitle,
} from "@/components/dashboard/dashboard-helpers";
import {
  IncomingSection,
  OngoingSection,
  PayoutProcessingSection,
  RecentSection,
} from "@/components/dashboard/job-sections";
import {
  GoLiveSection,
  LiveHeaderToggle,
} from "@/components/dashboard/live-controls";
import { ProblemSolvedFooter } from "@/components/dashboard/problem-solved-footer";
import { useDashboardArtisan } from "@/components/dashboard/use-dashboard-artisan";
import { useDashboardJobs } from "@/components/dashboard/use-dashboard-jobs";
import { VerificationCard } from "@/components/dashboard/verification-card";
import { subscribeIncomingPanelOpen } from "@/lib/jobs/incoming-popup-timing";
import { useT } from "@/lib/i18n";
import {
  isCustomerToProDualPath,
  proT2CareApproved,
} from "@/lib/pro-switch-onboarding";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function TechnicianDashboardPage() {
  const {
    theme,
    proLive,
    setProLive,
    backendUserId,
    accountType,
    isAuthenticated,
    switchAccount,
    hasProAccount,
    hasMotoristAccount,
    primaryAccountType,
    userProfile,
    proServices,
    setProOnboardingSheetRequired,
  } = useApp();
  const t = useT();
  const isLight = theme === "light";
  const dualCtoPro = isCustomerToProDualPath({
    hasMotoristAccount,
    hasProAccount,
    accountType,
    primaryAccountType,
  });
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const {
    incoming,
    ongoing,
    recent,
    payoutProcessing,
    jobsLoading,
    jobsCompletedCount,
    setJobsCompletedCount,
  } = useDashboardJobs(backendUserId);
  /** Incoming lower panel is up hide the dashboard's own Incoming list. */
  const [incomingPanelOpen, setIncomingPanelOpen] = useState(false);
  const [awayLabel, setAwayLabel] = useState(() => liveAwayButtonLabel());
  const artisan = useDashboardArtisan({
    backendUserId,
    proLive,
    liveErr,
    setJobsCompletedCount,
  });
  const t2CareOk = proT2CareApproved(userProfile, artisan);

  const dashboardTitle = useMemo(() => {
    const fromArtisan = artisan?.trade?.service;
    const fromProfile = userProfile?.services?.[0];
    const fromProList = proServices?.[0];
    return skillDashboardTitle(fromArtisan || fromProfile || fromProList);
  }, [artisan?.trade?.service, userProfile?.services, proServices]);

  useEffect(() => subscribeIncomingPanelOpen(setIncomingPanelOpen), []);

  const stage = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-700" : "text-white/75";

  // Refresh Away button copy when the 3-hour slot rolls over (local only)
  useEffect(() => {
    if (!proLive) return;
    const tick = () => setAwayLabel(liveAwayButtonLabel());
    tick();
    const t = window.setInterval(tick, 300_000);
    return () => window.clearInterval(t);
  }, [proLive]);

  const toggleLive = async () => {
    setLiveBusy(true);
    setLiveErr(null);
    try {
      const err = await setProLive(!proLive);
      if (err) setLiveErr(err);
    } catch {
      setLiveErr("Could not update Live status. Check GPS permission.");
    } finally {
      setLiveBusy(false);
    }
  };

  const showIncoming = incoming.length > 0 && !incomingPanelOpen;
  const showOngoing = ongoing.length > 0;
  /** Same for every trade: Recent always when finished jobs exist (not hidden by Incoming). */
  const showRecent = recent.length > 0;

  // Always paint a shell never blank when role/session is mid-switch
  if (isAuthenticated && accountType !== "professional") {
    return (
      <CustomerModeShell
        stage={stage}
        ink={ink}
        muted={muted}
        dashboardTitle={dashboardTitle}
        hasProAccount={hasProAccount}
        switchAccount={switchAccount}
      />
    );
  }

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", stage)}>
      <BankForcePanel surface="dashboard" />
      <div className={cn("z-20 shrink-0", stage)}>
        <PageHeader title={dashboardTitle} showBack={false} />
        <div className="flex items-center justify-end gap-2 px-3 pb-2">
          <LiveHeaderToggle
            liveBusy={liveBusy}
            proLive={proLive}
            isLight={isLight}
            toggleLive={toggleLive}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-3 pb-4 scrollbar-hide">
        {artisan || dualCtoPro ? (
          <VerificationCard
            artisan={artisan}
            t2CareOk={t2CareOk}
            userProfile={userProfile}
            isLight={isLight}
            ink={ink}
            muted={muted}
            t={t}
            setProOnboardingSheetRequired={setProOnboardingSheetRequired}
          />
        ) : null}

        <GoLiveSection
          liveBusy={liveBusy}
          proLive={proLive}
          liveErr={liveErr}
          awayLabel={awayLabel}
          ink={ink}
          muted={muted}
          toggleLive={toggleLive}
        />

        {jobsLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
          </div>
        )}

        {/* Incoming requests */}
        {!jobsLoading && showIncoming && (
          <IncomingSection
            incoming={incoming}
            backendUserId={backendUserId}
            ink={ink}
            muted={muted}
          />
        )}

        {/* Ongoing jobs easy navigation for active work */}
        {!jobsLoading && showOngoing && (
          <OngoingSection ongoing={ongoing} ink={ink} muted={muted} />
        )}

        {/* Payment processing — jobs where payout is pending settlement */}
        {!jobsLoading && payoutProcessing.length > 0 && (
          <PayoutProcessingSection
            payoutProcessing={payoutProcessing}
            ink={ink}
            muted={muted}
          />
        )}
        {/* Last 6 finished jobs vertical listing (Uber/inDrive style), place + area only — read-only, not clickable */}
        {!jobsLoading && showRecent && (
          <RecentSection recent={recent} ink={ink} muted={muted} />
        )}

        {/* Bottom: problem solved count (no gray plate) */}
        <ProblemSolvedFooter
          count={jobsCompletedCount}
          ink={ink}
          muted={muted}
        />
      </div>
    </div>
  );
}
