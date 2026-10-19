import type { ReactElement } from "react";
import { CountdownTimer } from "@/components/jobs/countdown-timer";
import { JobShell } from "@/components/jobs/job-shell";
import { nearbyProsStatusLine, PAIRING_WINDOW_MS } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn, firstNameOnly } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { Badge } from "@/components/ui/badge";
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
    muted,
    nearbyLiveCount,
    backendUserId,
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
    <div className="flex min-h-0 flex-col pt-3">
      <Badge variant="ona">{proLabel} request</Badge>
      <OnaTitle className="mt-3" title={title} subtitle={subtitle} />
      <div className="flex flex-col items-center justify-center py-8">
        {deadline && !finding ? (
          <CountdownTimer
            variant="ring"
            endsAt={deadline}
            totalMs={PAIRING_WINDOW_MS}
            onExpire={() => {
              void (async () => {
                try {
                  const { apiPairingSweep } = await import("@/lib/jobs/client");
                  await apiPairingSweep();
                } catch {
                  /* */
                }
                await load();
              })();
            }}
            className="text-ona-ink"
          />
        ) : (
          <div
            role="status"
            aria-label="Searching"
            className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-ona-brand border-t-transparent motion-reduce:animate-none"
          />
        )}
        {viewer === "motorist" && nearbyLine ? (
          <p
            role="status"
            className="mt-4 max-w-[280px] text-center text-[13px] font-semibold leading-snug text-ona-ink"
          >
            {nearbyLine}
          </p>
        ) : null}
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-2">
      <Button
        size="ona"
        variant="onaOutline"
        disabled={busy}
        onClick={() => setConfirmCancel({ actor: "motorist" })}
      >
        Cancel request
      </Button>
    </div>
  );

  return (
    <>
      <OnaScreen onBack={goJobsList} footer={footer}>
        {body}
      </OnaScreen>

      <CancelConfirmFromState
        isLight={isLight}
        confirmCancel={confirmCancel}
        setConfirmCancel={setConfirmCancel}
        cancelRequestInstant={cancelRequestInstant}
      />
    </>
  );
}
