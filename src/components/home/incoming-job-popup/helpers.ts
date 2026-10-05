import { apiTransition } from "@/lib/jobs/client";
import { PAIRING_ACTION_STAGES } from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import {
  resolveAppliedMultiplier,
  calculateCalloutFee,
} from "@/lib/callout/engine";
import { DEFAULT_TRADE_BASE_FEES } from "@/lib/callout/constants";
import type { CalloutQuote } from "@/lib/callout/constants";
import type { ProService } from "@/lib/types";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import { PRO_SERVICE_LABELS } from "@/lib/services";

/** Fallback fee for the OPEN trade (base fee + distance×rate) when the server
 * quote is not yet payable same formula the server runs. Never ₦0 for a
 * real trade. Always carries the applicable urgency multiplier: the chip from
 * the server quote stays in effect, but the current-time auto band (Night
 * 9PM-5AM Lagos) overrides it when higher. The urgency feature is forced
 * no fallback may show an un-multiplied fee. */
export function tradeFallbackFee(
  trade: string | null | undefined,
  quote?: Partial<
    Pick<CalloutQuote, "urgencyKind" | "urgencyMultiplier">
  > | null,
): number {
  if (!trade || !(trade in DEFAULT_TRADE_BASE_FEES)) return 0;
  const applied = resolveAppliedMultiplier({
    chipKind: quote?.urgencyKind ?? null,
    chipMultiplier: quote?.urgencyMultiplier ?? null,
    approvedDistanceKm: 0,
    acceptedAt: new Date(),
  }).multiplier;
  const fee = calculateCalloutFee({
    tradeId: trade as ProService,
    approvedRouteDistanceKm: 0,
    urgencyMultiplier: applied,
  });
  return Number.isFinite(fee.calloutFee) ? fee.calloutFee : 0;
}

export function isPairingAlert(j: JobRecord): boolean {
  return (
    PAIRING_ACTION_STAGES.has(j.pairingStage ?? "") ||
    PAIRING_ACTION_STAGES.has(j.status ?? "")
  );
}

export function idemFor(j: JobRecord, proId: string, event: string): string {
  return `${event}:${j.id}:${(proId || "").slice(0, 8)}`;
}

/** Hand the just-accepted job to the negotiation screen so it paints
 * instantly from this snapshot instead of spinning until its first GET.
 * JobFlowScreen consumes `ona-seed-job:{id}` on mount and revalidates via
 * its normal loader/poll machinery. Card fields are merged under the fresh
 * server job so nothing the card already had (photos, name) is lost if the
 * transition response is slimmer than the list record. */
export function seedNegotiationScreen(card: JobRecord, fresh: JobRecord): void {
  try {
    window.sessionStorage.setItem(
      `ona-seed-job:${fresh.id || card.id}`,
      JSON.stringify({ ...card, ...fresh }),
    );
  } catch {
    /* ignore */
  }
}

/** Server messages that mean "this request is no longer this pro's live
 * request" (the customer closed/cancelled it, or it moved to another pro).
 * The server already refuses the tap surface a friendly message and drop
 * the card instead of echoing the raw API error. */
export function isStaleRequestError(message?: string | null): boolean {
  return Boolean(
    message &&
    /not open for this action|not awaiting confirmation|moved on while opening|moved on before confirmation|not assigned to this request/i.test(
      message,
    ),
  );
}

export function jobTitle(j: JobRecord): string {
  return isAutomotiveTrade(j.serviceType) && j.motoristVehicle?.trim()
    ? j.motoristVehicle.trim()
    : j.motoristName?.split(/\s+/)[0] ||
        PRO_SERVICE_LABELS[j.serviceType] ||
        "Service Request";
}

/** Server-side decline fired after the card has already left the panel. */
export async function sendDecline(
  job: JobRecord,
  backendUserId: string | null | undefined,
): Promise<void> {
  const id = job.id;
  try {
    if (isPairingAlert(job)) {
      await apiTransition({
        jobId: id,
        event: "DECLINE",
        actor: "repair_pro",
        actorId: backendUserId || undefined,
        reason: "Currently unavailable",
        idempotencyKey: backendUserId
          ? idemFor(job, backendUserId, "DECLINE")
          : undefined,
      });
    } else {
      await apiTransition({
        jobId: id,
        event: "CANCEL",
        actor: "repair_pro",
        actorId: backendUserId || undefined,
        reason: "pro_declined",
      });
    }
  } catch {
    /* panel already updated */
  }
}
