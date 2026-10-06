import type { ReactElement } from "react";
import { CountdownTimer } from "@/components/jobs/countdown-timer";
import { JobShell } from "@/components/jobs/job-shell";
import { nearbyProsStatusLine, PAIRING_WINDOW_MS } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn, firstNameOnly } from "@/lib/utils";
import { SearchingScreen } from "../job-flow/searching-screen";
import { CancelConfirmFromState } from "./shared-pieces";
import type { JobFlowCtx } from "./use-job-flow-controller";

/**
 * SSPE DISPATCH STATES: waiting_for_selected / selected_review /
 * sequential_pairing / waiting_for_pro / reserved. All countdowns render
 * pairing_deadline (display-only, D3), the server sweep owns timing.
 * Repair Pro: full-page UI deleted for these, panel only (see guards hook).
 */
export function renderPairingStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const {
    viewer,
    isLight,
    ink,
    muted,
    nearbyLiveCount,
    backendUserId,
    err,
    goJobsList,
    busy,
    setConfirmCancel,
    confirmCancel,
    cancelRequestInstant,
    load,
  } = c;
  // Pro never sees this full page redirect effect sends them to dashboard.
  if (viewer === "repair_pro") {
    return (
      <JobShell isLight={isLight} title="Service Request" compactHeader>
        <p
          className={cn(
            "px-0.5 pt-8 text-center text-[13px] font-medium",
            muted,
          )}
        >
          Opening request…
        </p>
      </JobShell>
    );
  }

  const deadline = job.pairingDeadline || null;
  const reviewing =
    job.status === "selected_review" || job.status === "reserved";
  const finding = job.status === "sequential_pairing";
  const proLabel = PRO_SERVICE_LABELS[job.serviceType] || job.serviceType;
  const nearbyLine =
    viewer === "motorist"
      ? nearbyProsStatusLine(nearbyLiveCount ?? 0, proLabel)
      : null;

  // Customer: sequential pairing actively pings pros → full search screen.
  if (viewer === "motorist" && finding) {
    return (
      <SearchingScreen
        job={job}
        viewer={viewer}
        backendUserId={backendUserId}
        isLight={isLight}
        err={err}
        onBack={goJobsList}
        nearbyLine={nearbyLine}
      />
    );
  }

  // Customer-only full page (pro uses lower panel exclusively)
  const title =
    job.status === "waiting_for_selected"
      ? `Waiting for ${proLabel}`
      : reviewing
        ? "Repair Pro reviewing your request"
        : `Finding a ${proLabel} near you`;

  const subtitle =
    job.status === "waiting_for_selected"
      ? `${firstNameOnly(
          job.repairProName === "Repair Pro" ? null : job.repairProName,
          proLabel,
        )} has received your request and will respond shortly.`
      : reviewing
        ? "The Repair Pro is reviewing your request and will respond shortly."
        : finding
          ? "We’re finding another pro with the same skill."
          : "A pro is checking your request.";

  const body = (
    <div className="flex min-h-0 flex-col bg-transparent px-0.5 pt-1">
      <div className="shrink-0 space-y-3 bg-transparent">
        <div className="flex flex-col items-center justify-center bg-transparent py-3">
          {deadline && !finding ? (
            <CountdownTimer
              variant="ring"
              endsAt={deadline}
              totalMs={PAIRING_WINDOW_MS}
              onExpire={() => {
                void (async () => {
                  try {
                    const { apiPairingSweep } =
                      await import("@/lib/jobs/client");
                    await apiPairingSweep();
                  } catch {
                    /* */
                  }
                  await load();
                })();
              }}
              className={ink}
            />
          ) : (
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#FF6B35] border-t-transparent" />
          )}
          {viewer === "motorist" && nearbyLine ? (
            <p
              className={cn(
                "mt-3 max-w-[280px] text-center text-[13px] font-bold leading-snug",
                ink,
              )}
            >
              {nearbyLine}
            </p>
          ) : null}
          <p
            className={cn(
              "mt-2 max-w-[280px] text-center text-[13px] font-semibold leading-snug",
              muted,
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );

  const footer = (
    <div className="space-y-2">
      {err && (
        <p className="text-center text-[12px] font-semibold text-red-500">
          {err}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => setConfirmCancel({ actor: "motorist" })}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center rounded-md border-0 text-[13px] font-semibold",
          isLight ? "bg-black/10 text-slate-900" : "bg-[#2c2c2e] text-white",
        )}
      >
        Cancel request
      </button>
    </div>
  );

  return (
    <>
      <JobShell
        isLight={isLight}
        title={title}
        compactHeader
        onBack={goJobsList}
        footer={footer}
      >
        {body}
      </JobShell>

      <CancelConfirmFromState
        isLight={isLight}
        confirmCancel={confirmCancel}
        setConfirmCancel={setConfirmCancel}
        cancelRequestInstant={cancelRequestInstant}
      />
    </>
  );
}
