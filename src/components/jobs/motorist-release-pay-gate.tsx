"use client";

/**
 * MotoristReleasePayGate Confirm Job & Release Payment
 *
 * Only while status=completed AND customer has NOT yet confirmed (no satisfiedAt)
 * and escrow is not already released.
 *
 * After one confirm (even if Flutterwave payout fails): never re-prompt.
 * After release: never re-prompt.
 */

import { ReleaseDialog } from "./motorist-release-pay-gate/release-dialog";
import { ReleaseMinimizedBanner } from "./motorist-release-pay-gate/release-minimized-banner";
import { ReleaseReceipt } from "./motorist-release-pay-gate/release-receipt";
import { useReleasePayGate } from "./motorist-release-pay-gate/use-release-pay-gate";

export { SwipeToRelease } from "./motorist-release-pay-gate/swipe-to-release";

export function MotoristReleasePayGate() {
  const {
    backendUserId,
    isLight,
    pathname,
    pending,
    minimized,
    busy,
    err,
    setErr,
    success,
    receipt,
    pendingTotal,
    calloutQuote,
    onMinimize,
    onExpand,
    onSatisfied,
  } = useReleasePayGate();

  if (success && receipt) {
    return <ReleaseReceipt receipt={receipt} isLight={isLight} />;
  }

  if (!pending) return null;

  // On the live job page the job shell already has the single CTA
  // do not stack another modal (avoids 2-3 identical buttons).
  const onThisJobPage =
    pathname === `/jobs/${pending.id}` ||
    pathname.startsWith(`/jobs/${pending.id}/`);
  if (onThisJobPage && !minimized) return null;

  if (minimized) {
    return <ReleaseMinimizedBanner onExpand={onExpand} />;
  }

  return (
    <ReleaseDialog
      pending={pending}
      pendingTotal={pendingTotal}
      calloutQuote={calloutQuote}
      isLight={isLight}
      err={err}
      setErr={setErr}
      busy={busy}
      backendUserId={backendUserId}
      onMinimize={onMinimize}
      onSatisfied={onSatisfied}
    />
  );
}
