"use client";

/**
 * Admin Dashboard — primary daily workspace.
 * Real-time platform metrics, active jobs, dispatch monitoring, escrow, and dispute resolution.
 */

import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardMetrics } from "@/components/admin/care-desk/dashboard-metrics";
import { DashboardLiveOps } from "@/components/admin/care-desk/dashboard-live-ops";
import { DashboardJobBoard } from "@/components/admin/care-desk/dashboard-job-board";
import { DashboardBackup } from "@/components/admin/care-desk/dashboard-backup";
import { DashboardSearch } from "@/components/admin/care-desk/dashboard-search";
import { DashboardCaseActions } from "@/components/admin/care-desk/dashboard-case-actions";
import { useCareDesk } from "@/components/admin/care-desk/use-care-desk";
import { Loader2 } from "lucide-react";

export default function CareDeskPage() {
  const {
    adminName,
    adminRole,
    gateRoleLabel,
    ready,
    gateError,
    status,
    query,
    setQuery,
    hits,
    board,
    dash,
    selectedJobId,
    jobDetail,
    dashSettled,
    busy,
    backupBusy,
    latestBackup,
    backupSearch,
    setBackupSearch,
    refreshBoard,
    runBackupNow,
    openJob,
    runAction,
    job,
    flow,
  } = useCareDesk();

  if (!ready || (!dash && !dashSettled)) {
    return (
      <AdminShell
        adminName={adminName}
        adminRole={adminRole}
        roleLabel={gateRoleLabel}
      >
        <div className="flex items-center justify-center min-h-[50vh] text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-ona-brand" />
          {gateError || "Loading dashboard data…"}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      adminName={status?.fullName || adminName}
      adminRole={status?.adminRole || adminRole}
      roleLabel={status?.roleLabel || gateRoleLabel}
    >
      {/* 1. Full-Width 8 Dashboard Metrics */}
      <div className="w-full">
        <DashboardMetrics dash={dash} board={board} />
      </div>

      {/* 2. Two-Column Layout (Live ops & Job board on Left; Local BackUp on par on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start mt-5 sm:mt-6">
        {/* Left Column (7 cols): Live ops + Live job board */}
        <div className="lg:col-span-7 flex flex-col min-w-0">
          <DashboardLiveOps board={board} />
          <DashboardJobBoard
            board={board}
            selectedJobId={selectedJobId}
            refreshBoard={refreshBoard}
            openJob={openJob}
          />
        </div>

        {/* Right Column (5 cols): Local BackUp (on par with Live ops) + Search users + Case actions */}
        <div className="lg:col-span-5 flex flex-col min-w-0">
          <DashboardBackup
            backupBusy={backupBusy}
            busy={busy}
            latestBackup={latestBackup}
            backupSearch={backupSearch}
            setBackupSearch={setBackupSearch}
            runBackupNow={runBackupNow}
          />
          <DashboardSearch
            query={query}
            setQuery={setQuery}
            hits={hits}
            openJob={openJob}
          />
          <DashboardCaseActions
            jobDetail={jobDetail}
            job={job}
            flow={flow}
            selectedJobId={selectedJobId}
            busy={busy}
            runAction={runAction}
          />
        </div>
      </div>
    </AdminShell>
  );
}
