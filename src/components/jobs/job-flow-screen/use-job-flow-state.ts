import { useEffect, useRef, useState } from "react";
import type { DisputeReason, JobRecord } from "@/lib/jobs/types";
import type { ConfirmCancelState } from "./types";

/** All local UI state of the job flow screen (declaration order preserved). */
export function useJobFlowState(jobId: string) {
  const [job, setJob] = useState<JobRecord | null>(null);
  const jobRef = useRef<JobRecord | null>(null);
  /**
   * Job id actually in flight. Starts as the URL param; for `/jobs/new` it is
   * swapped to the real id the moment the background create resolves, so all
   * loaders/pollers pick up the real job without re-mounting.
   */
  const activeJobIdRef = useRef(jobId);
  useEffect(() => {
    activeJobIdRef.current = jobId;
  }, [jobId]);
  const [err, setErr] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  /** Release/payout errors must survive job polls (load() used to wipe setErr). */
  const [stickyReleaseErr, setStickyReleaseErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offerInput, setOfferInput] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] =
    useState<DisputeReason>("work_incomplete");
  const [disputeDesc, setDisputeDesc] = useState("");
  /** 0 = blank until customer taps a star */
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewLeft, setReviewLeft] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [locHint, setLocHint] = useState<string | null>(null);
  /** Ended-chat gate: OK stay / View read-only */
  const [chatGateOpen, setChatGateOpen] = useState(false);
  const [, setChatGateViewHref] = useState<string | null>(null);

  const [retryingSearch, setRetryingSearch] = useState(false);
  /** Live pros of this trade in customer radius pairing status under timer */
  const [nearbyLiveCount, setNearbyLiveCount] = useState<number | null>(null);
  /** Arrived / Work in progress: home-style swipe sheet */
  const [tripSheetExpanded, setTripSheetExpanded] = useState(false);
  const tripGestureY = useRef<number | null>(null);
  /** Pay screen: single Cancel → choose payment vs request */
  const [payCancelOpen, setPayCancelOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  /** Confirm-before-cancel: actor stored until the user confirms */
  const [confirmCancel, setConfirmCancel] = useState<ConfirmCancelState>(null);
  /** Reroute notification overlay */
  const [rerouteAlert, setRerouteAlert] = useState<string | null>(null);

  return {
    job,
    setJob,
    jobRef,
    activeJobIdRef,
    err,
    setErr,
    redirecting,
    setRedirecting,
    stickyReleaseErr,
    setStickyReleaseErr,
    busy,
    setBusy,
    offerInput,
    setOfferInput,
    disputeOpen,
    setDisputeOpen,
    disputeReason,
    setDisputeReason,
    disputeDesc,
    setDisputeDesc,
    rating,
    setRating,
    reviewText,
    setReviewText,
    reviewLeft,
    setReviewLeft,
    receiptOpen,
    setReceiptOpen,
    flash,
    setFlash,
    locHint,
    setLocHint,
    chatGateOpen,
    setChatGateOpen,
    setChatGateViewHref,
    retryingSearch,
    setRetryingSearch,
    nearbyLiveCount,
    setNearbyLiveCount,
    tripSheetExpanded,
    setTripSheetExpanded,
    tripGestureY,
    payCancelOpen,
    setPayCancelOpen,
    showBreakdown,
    setShowBreakdown,
    confirmCancel,
    setConfirmCancel,
    rerouteAlert,
    setRerouteAlert,
  };
}

export type JobFlowState = ReturnType<typeof useJobFlowState>;
