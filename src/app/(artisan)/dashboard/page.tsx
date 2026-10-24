"use client";

/**
 * Pro dashboard Uber-style list under Live (no section titles):
 * - Incoming: Service Request only, real meet address (never “Current location”)
 * - Recent: Uber place + area only (never problem text / demo address)
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isProService, PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import { CustomerModeShell } from "@/components/dashboard/customer-mode-shell";
import { skillDashboardTitle } from "@/components/dashboard/dashboard-helpers";
import {
  IncomingSection,
  OngoingSection,
  PayoutProcessingSection,
  RecentSection,
} from "@/components/dashboard/job-sections";
import { ProDashboardHeader } from "@/components/dashboard/pro-dashboard-header";
import { ProProfileCard } from "@/components/dashboard/pro-profile-card";
import { ProTier2Banner } from "@/components/dashboard/pro-tier2-banner";
import { ProOnlineAction } from "@/components/dashboard/pro-online-action";
import { ProEmptyState } from "@/components/dashboard/pro-empty-state";
import { useDashboardArtisan } from "@/components/dashboard/use-dashboard-artisan";
import { useDashboardJobs } from "@/components/dashboard/use-dashboard-jobs";
import { subscribeIncomingPanelOpen } from "@/lib/jobs/incoming-popup-timing";
import {
  isCustomerToProDualPath,
  proT2CareApproved,
} from "@/lib/pro-switch-onboarding";
import { useApp } from "@/lib/store";

export default function TechnicianDashboardPage() {
  const router = useRouter();
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
    setJobsCompletedCount,
  } = useDashboardJobs(backendUserId);
  const [incomingPanelOpen, setIncomingPanelOpen] = useState(false);
  const artisan = useDashboardArtisan({
    backendUserId,
    proLive,
    liveErr,
    setJobsCompletedCount,
  });
  const t2CareOk = proT2CareApproved(userProfile, artisan);

  const dashboardTrade = useMemo(() => {
    const fromArtisan = artisan?.trade?.service;
    const fromProfile = userProfile?.services?.[0];
    const fromProList = proServices?.[0];
    const raw = fromArtisan || fromProfile || fromProList;
    if (raw && isProService(raw)) {
      return PRO_SERVICE_LABELS[raw];
    }
    return "Mechanic";
  }, [artisan?.trade?.service, userProfile?.services, proServices]);

  useEffect(() => subscribeIncomingPanelOpen(setIncomingPanelOpen), []);

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
  const showRecent = recent.length > 0;
  const hasActiveJobs = showIncoming || showOngoing || showRecent || payoutProcessing.length > 0;

  const handleContinueVerification = () => {
    router.push("/verify/tier-2");
  };

  // Always paint a shell never blank when role/session is mid-switch
  if (isAuthenticated && accountType !== "professional") {
    return (
      <CustomerModeShell
        stage="bg-ona-bg"
        ink="text-ona-ink"
        muted="text-ona-muted"
        dashboardTitle={dashboardTrade}
        hasProAccount={hasProAccount}
        switchAccount={switchAccount}
      />
    );
  }

  const showTier2Banner = (artisan || dualCtoPro) && !t2CareOk;

  return (
    <div className="ona2 relative flex h-full min-h-0 flex-col bg-ona-bg text-ona-ink">
      <ProDashboardHeader title="Dashboard" trade={dashboardTrade} />

      <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-5 pb-24 scrollbar-hide">
        {/* Profile Card */}
        <ProProfileCard
          displayName={userProfile?.fullName}
          avatarUrl={userProfile?.avatarUrl}
          proLive={proLive}
        />

        {/* Tier 2 Verification Card */}
        {showTier2Banner ? (
          <ProTier2Banner onContinue={handleContinueVerification} />
        ) : null}

        {/* Go Online / Go Offline Action */}
        <ProOnlineAction
          proLive={proLive}
          liveBusy={liveBusy}
          onToggle={toggleLive}
        />

        {jobsLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
          </div>
        )}

        {/* Incoming requests */}
        {!jobsLoading && showIncoming && (
          <IncomingSection
            incoming={incoming}
            backendUserId={backendUserId}
            ink="text-ona-ink"
            muted="text-ona-muted"
          />
        )}

        {/* Ongoing jobs */}
        {!jobsLoading && showOngoing && (
          <OngoingSection ongoing={ongoing} ink="text-ona-ink" muted="text-ona-muted" />
        )}

        {/* Payout Processing */}
        {!jobsLoading && payoutProcessing.length > 0 && (
          <PayoutProcessingSection
            payoutProcessing={payoutProcessing}
            ink="text-ona-ink"
            muted="text-ona-muted"
          />
        )}

        {/* Finished jobs */}
        {!jobsLoading && showRecent && (
          <RecentSection recent={recent} ink="text-ona-ink" muted="text-ona-muted" />
        )}

        {/* Empty State when no jobs */}
        {!jobsLoading && !hasActiveJobs && (
          <ProEmptyState
            title="No problem solved"
            subtitle="Solved problems will appear here."
          />
        )}
      </div>
    </div>
  );
}
