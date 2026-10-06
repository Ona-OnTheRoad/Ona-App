"use client";

/**
 * Customer Care desk primary daily workspace.
 * Search · live board · one-click actions (password popup only when needed).
 */

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import { BackupPanel } from "@/components/admin/care-desk/backup-panel";
import { CaseActionsPanel } from "@/components/admin/care-desk/case-actions-panel";
import { JobBoardPanel } from "@/components/admin/care-desk/job-board-panel";
import { SearchPanel } from "@/components/admin/care-desk/search-panel";
import {
  LiveOpsCards,
  TotalsCards,
} from "@/components/admin/care-desk/stat-cards";
import { useCareDesk } from "@/components/admin/care-desk/use-care-desk";

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
    msg,
    err,
    busy,
    backupBusy,
    latestBackup,
    backupSearch,
    setBackupSearch,
    backupSnaps,
    refreshBoard,
    runBackupNow,
    openJob,
    runAction,
    job,
    flow,
  } = useCareDesk();

  if (!ready) {
    return (
      <AdminShell
        adminName={adminName}
        adminRole={adminRole}
        roleLabel={gateRoleLabel}
      >
        <h1 className="om-admin-h1">Dashboard</h1>
        <p className="om-admin-muted">
          {gateError || "Loading admin session…"}
        </p>
        <AdminGuideBanner pageId="dashboard" />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      adminName={status?.fullName || adminName}
      adminRole={status?.adminRole || adminRole}
      roleLabel={status?.roleLabel || gateRoleLabel}
    >
      <h1 className="om-admin-h1">Dashboard</h1>
      <p className="om-admin-sub">
        Live overview of Ona: totals, open jobs, and Care tools. Search people
        or jobs, watch the board, and run escrow / freeze / dispute from here.
      </p>

      <AdminGuideBanner pageId="dashboard" />

      <TotalsCards dash={dash} board={board} />

      <p
        className="om-admin-muted"
        style={{ marginBottom: "1rem", fontSize: 12 }}
      >
        Super Admin can release escrow, freeze users, and resolve disputes
        without a second password. Customer Care may still see a temporary staff
        password popup on those actions only.
      </p>

      {/* Local BackUp money fallout protection */}
      <BackupPanel
        backupBusy={backupBusy}
        busy={busy}
        latestBackup={latestBackup}
        backupSearch={backupSearch}
        setBackupSearch={setBackupSearch}
        backupSnaps={backupSnaps}
        runBackupNow={runBackupNow}
      />

      {err ? <div className="om-admin-error">{err}</div> : null}
      {msg ? (
        <div
          className="om-admin-panel"
          style={{ background: "var(--om-success-bg)", marginBottom: "1rem" }}
        >
          {msg}
        </div>
      ) : null}

      {/* Search */}
      <SearchPanel
        query={query}
        setQuery={setQuery}
        hits={hits}
        openJob={openJob}
      />

      {/* Live ops strip */}
      <h2 className="om-admin-section-title">Live ops</h2>
      <LiveOpsCards board={board} />

      <div className="om-care-split">
        {/* Live board */}
        <JobBoardPanel
          board={board}
          selectedJobId={selectedJobId}
          refreshBoard={refreshBoard}
          openJob={openJob}
        />

        {/* Job actions */}
        <CaseActionsPanel
          jobDetail={jobDetail}
          job={job}
          flow={flow}
          selectedJobId={selectedJobId}
          busy={busy}
          runAction={runAction}
        />
      </div>
    </AdminShell>
  );
}
