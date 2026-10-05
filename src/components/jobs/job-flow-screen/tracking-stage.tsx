import type { ReactElement } from "react";
import { JobShell } from "@/components/jobs/job-shell";
import { isWithinArrivalProximity } from "@/lib/callout/arrival";
import { isJobEndedStatus } from "@/lib/chat-expired";
import { PRO_TRIP_STATUS_COPY, TRIP_STATUS_COPY } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { DisputeNode, RerouteAlertOverlay } from "./shared-pieces";
import { TripCallMessageRow } from "./trip-call-message-row";
import { TripDetails } from "./trip-details";
import { TripFooter } from "./trip-footer";
import { TripMetaHeader } from "./trip-meta-header";
import { createProAdvance, PRO_TRIP_ACTIONS } from "./trip-pro-advance";
import { TripSwipeBody } from "./trip-swipe-body";
import type { JobFlowCtx } from "./use-job-flow-controller";

/** TRACKING / ACTIVE: paid_booked, en_route, arrived, in_progress. */
export function renderTrackingStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const {
    viewer,
    isLight,
    actorId,
    ink,
    muted,
    err,
    busy,
    flash,
    locHint,
    goJobsList,
    calloutQuote,
    startJobCall,
    openJobChat,
    setBusy,
    setErr,
    setLocHint,
    setFlash,
    commitJob,
    chatGateOpen,
    setChatGateOpen,
    setChatGateViewHref,
    cancelRequestInstant,
    disputeOpen,
    setDisputeOpen,
    disputeReason,
    setDisputeReason,
    disputeDesc,
    setDisputeDesc,
    run,
    tripSheetExpanded,
    setTripSheetExpanded,
    tripGestureY,
    rerouteAlert,
    setRerouteAlert,
  } = c;
  const copySource =
    viewer === "repair_pro" ? PRO_TRIP_STATUS_COPY : TRIP_STATUS_COPY;
  const copy = copySource[job.status] ||
    TRIP_STATUS_COPY[job.status] || {
      title: "Booked",
      subtitle: "",
    };
  /** Short catalog trade Mechanic, Vulcanizer, Tow, etc. */
  const tradeLabel =
    PRO_SERVICE_LABELS[job.serviceType] || job.serviceType || "Repair Pro";
  /**
   * Customer track-trip header: trade name, not generic "Repair Pro".
   * e.g. "Mechanic is OnTheRoad"
   */
  const trackTripTitle =
    viewer === "motorist" && job.status === "en_route"
      ? `${tradeLabel} is OnTheRoad`
      : copy.title;

  // Prefer earliest unfinished step (Start trip → … → Mark complete)
  const nextPro = PRO_TRIP_ACTIONS.find((a) => a.when.includes(job.status));

  const arrivalOk = job.proLocation
    ? isWithinArrivalProximity(job.proLocation, job.motoristLocation).ok
    : false;
  const arrivedBlocked = nextPro?.event === "MARK_ARRIVED" && !arrivalOk;

  const proAdvance = createProAdvance({
    job,
    actorId,
    arrivalOk,
    setBusy,
    setErr,
    setLocHint,
    setFlash,
    commitJob,
  });

  // Ready to go (paid_booked): no map.
  // En route / arrived / WIP: map + solid lower panel (details never float on map).
  // Map-only chrome: grey Time · Distance · Escrow Held bar.
  const showMap = job.status !== "paid_booked";
  const isReadyToGo = job.status === "paid_booked";
  const isSwipeTrip =
    job.status === "en_route" ||
    job.status === "arrived" ||
    job.status === "in_progress";
  const isPostArrival =
    job.status === "arrived" || job.status === "in_progress";

  const tripMetaHeader = (
    <TripMetaHeader
      job={job}
      viewer={viewer}
      isLight={isLight}
      ink={ink}
      muted={muted}
      calloutQuote={calloutQuote}
    />
  );

  const tripDetails = (
    <TripDetails
      job={job}
      viewer={viewer}
      isLight={isLight}
      ink={ink}
      muted={muted}
      isReadyToGo={isReadyToGo}
      isPostArrival={isPostArrival}
    />
  );

  const callMessageRow = (
    <TripCallMessageRow
      isSwipeTrip={isSwipeTrip}
      chatClosedForever={isJobEndedStatus(job.status)}
      onCall={() => startJobCall(job)}
      onMessage={() => void openJobChat(job)}
    />
  );

  const footerBlock = (
    <TripFooter
      job={job}
      viewer={viewer}
      isLight={isLight}
      tradeLabel={tradeLabel}
      showMap={showMap}
      busy={busy}
      err={err}
      flash={flash}
      locHint={locHint}
      chatGateOpen={chatGateOpen}
      setChatGateOpen={setChatGateOpen}
      setChatGateViewHref={setChatGateViewHref}
      setDisputeOpen={setDisputeOpen}
      nextPro={nextPro}
      arrivedBlocked={arrivedBlocked}
      proAdvance={proAdvance}
      cancelRequestInstant={cancelRequestInstant}
    />
  );

  const disputeNode = (
    <DisputeNode
      open={disputeOpen}
      by={viewer}
      job={job}
      isLight={isLight}
      reason={disputeReason}
      setReason={setDisputeReason}
      desc={disputeDesc}
      setDesc={setDisputeDesc}
      busy={busy}
      setOpen={setDisputeOpen}
      run={run}
    />
  );

  /* ── Arrived / Work in progress: map + swipeable lower panel ── */
  if (isSwipeTrip) {
    return (
      <>
        <JobShell
          isLight={isLight}
          title={trackTripTitle}
          subtitle={undefined}
          compactHeader
          onBack={goJobsList}
          fullBleed
          fillBody
          footer={footerBlock}
        >
          <TripSwipeBody
            job={job}
            viewer={viewer}
            isLight={isLight}
            muted={muted}
            tripSheetExpanded={tripSheetExpanded}
            setTripSheetExpanded={setTripSheetExpanded}
            gestureYRef={tripGestureY}
            metaHeader={tripMetaHeader}
            details={tripDetails}
            callMessageRow={callMessageRow}
          />
          {disputeNode}
        </JobShell>

        {/* Reroute notification overlay for motorist */}
        {rerouteAlert && viewer === "motorist" && (
          <RerouteAlertOverlay
            isLight={isLight}
            ink={ink}
            muted={muted}
            onContinue={() => setRerouteAlert(null)}
          />
        )}
      </>
    );
  }

  /* ── Ready to go only (no map) details stay on solid stage panel ── */
  return (
    <JobShell
      isLight={isLight}
      title={
        viewer === "motorist"
          ? PRO_SERVICE_LABELS[job.serviceType] || "Booked"
          : copy.title
      }
      compactHeader
      onBack={goJobsList}
      footer={footerBlock}
    >
      <div className="space-y-4 px-0 pb-2 pt-1">
        {tripMetaHeader}
        {tripDetails}
        {callMessageRow}
      </div>
      {disputeNode}
    </JobShell>
  );
}
