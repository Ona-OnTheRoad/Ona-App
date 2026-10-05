import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { useRouter } from "next/navigation";
import { apiTransition, getCurrentPosition } from "@/lib/jobs/client";
import {
  markAcceptInFlight,
  PAIRING_ACTION_STAGES,
} from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { idemFor, isStaleRequestError, seedNegotiationScreen } from "./helpers";
import type { IncomingState } from "./use-incoming-state";
import type { RemoveJob } from "./types";

interface UseFixItParams {
  backendUserId: string | null | undefined;
  router: ReturnType<typeof useRouter>;
  state: IncomingState;
  removeRef: MutableRefObject<RemoveJob>;
}

/**
 * One-tap "I can fix this": navigates to the negotiation screen IMMEDIATELY
 * (seeded with the card data so it paints instantly) while OPEN + CONFIRM
 * finish in the background. The popup stays mounted app-wide (phone shell),
 * so errors still surface here and the job page's own polls reconcile the
 * confirmed state within seconds.
 * - pairing-stage: OPEN (reserve; usually already done by ensureOpened at
 *   surface time so this is a server noop) then CONFIRM (accept)
 * - classic: START_NEGOTIATION + session flag so the page skips the gate.
 * Errors are surfaced inline so a failed tap is never silent.
 */
export function useFixIt({
  backendUserId,
  router,
  state,
  removeRef,
}: UseFixItParams) {
  const {
    openAttemptedRef,
    setAcceptingId,
    setActionError,
    fullyHide,
    notifyRequestClosed,
  } = state;

  return useCallback(
    async (j: JobRecord) => {
      if (!backendUserId) return;
      setAcceptingId(j.id);
      setActionError(null);
      markAcceptInFlight(j.id);
      try {
        // Branch on the LIVE flow status, not pairingStage: a card that
        // already moved to negotiating (e.g. stale pairing stage left on the
        // record) must take the classic path, not fail the CONFIRM gate.
        if (PAIRING_ACTION_STAGES.has(j.status ?? "")) {
          const stage = j.pairingStage ?? "";
          const needsOpen =
            stage === "waiting_for_selected" || stage === "waiting_for_pro";
          // Instant open: paint the negotiation screen from the card data
          // right now the background transitions reconcile the rest.
          fullyHide();
          seedNegotiationScreen(j, {
            ...j,
            status: "negotiating",
            pairingStage: null,
          });
          router.push(`/jobs/${j.id}`);
          // GPS is best-effort never block the confirm on it. Start it
          // alongside OPEN and only attach the fix if it resolves within
          // ~250ms; otherwise the server uses the pro's existing Live pin.
          const gpsPromise = getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 5000,
          })
            .then((pos) => ({
              proLat: pos.coords.latitude,
              proLng: pos.coords.longitude,
              accuracyM: pos.coords.accuracy,
              capturedAt: new Date().toISOString(),
            }))
            .catch(() => ({}));
          if (needsOpen && !openAttemptedRef.current.has(j.id)) {
            openAttemptedRef.current.add(j.id);
            const openRes = await apiTransition({
              jobId: j.id,
              event: "OPEN",
              actor: "repair_pro",
              actorId: backendUserId,
              idempotencyKey: idemFor(j, backendUserId, "OPEN"),
            });
            if (!openRes.ok) {
              if (isStaleRequestError(openRes.message)) {
                removeRef.current(j.id);
                notifyRequestClosed(j.id, {
                  job: j,
                  status: j.status,
                  movedOn: /not assigned|moved on/i.test(openRes.message || ""),
                });
              } else {
                setActionError(
                  openRes.message ||
                    "Could not open this request. Please try again.",
                );
              }
              return;
            }
          }
          const gps = await Promise.race([
            gpsPromise,
            new Promise<Record<string, never>>((resolve) =>
              setTimeout(() => resolve({}), 250),
            ),
          ]);
          const confirmRes = await apiTransition({
            jobId: j.id,
            event: "CONFIRM",
            actor: "repair_pro",
            actorId: backendUserId,
            idempotencyKey: idemFor(j, backendUserId, "CONFIRM"),
            ...gps,
          });
          if (!confirmRes.ok) {
            if (isStaleRequestError(confirmRes.message)) {
              removeRef.current(j.id);
              notifyRequestClosed(j.id, {
                job: j,
                status: j.status,
                movedOn: /not assigned|moved on/i.test(
                  confirmRes.message || "",
                ),
              });
            } else {
              setActionError(
                confirmRes.message ||
                  "Could not confirm this request. Please try again.",
              );
            }
            return;
          }
          seedNegotiationScreen(j, confirmRes.data.job);
        } else {
          const res = await apiTransition({
            jobId: j.id,
            event: "START_NEGOTIATION",
            actor: "repair_pro",
            actorId: backendUserId,
          });
          if (!res.ok) {
            setActionError(
              res.message || "Could not connect. Please try again.",
            );
            return;
          }
          // Skip the full-page "Can you fix this?" gate go straight to
          // negotiation (lower-panel flow).
          try {
            sessionStorage.setItem(`om-can-fix-${j.id}`, "1");
          } catch {
            /* */
          }
          fullyHide();
          seedNegotiationScreen(j, res.data.job);
          router.push(`/jobs/${j.id}`);
        }
      } finally {
        setAcceptingId(null);
      }
    },
    [
      backendUserId,
      fullyHide,
      notifyRequestClosed,
      router,
      openAttemptedRef,
      removeRef,
      setAcceptingId,
      setActionError,
    ],
  );
}
