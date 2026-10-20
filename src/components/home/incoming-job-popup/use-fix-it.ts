import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import type { useRouter } from "next/navigation";
import { apiTransition, getCurrentPosition } from "@/lib/jobs/client";
import {
  PAIRING_ACTION_STAGES,
} from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { idemFor, isStaleRequestError, seedNegotiationScreen } from "./helpers";
import { ensureIncomingRequestOpen, openRequestKey } from "./open-request";
import type { IncomingState } from "./use-incoming-state";
import type { RemoveJob } from "./types";

interface UseFixItParams {
  backendUserId: string | null | undefined;
  router: ReturnType<typeof useRouter>;
  state: IncomingState;
  removeRef: MutableRefObject<RemoveJob>;
}

/** Keep the card and errors visible until the server confirms negotiation. */
export function useFixIt({
  backendUserId,
  router,
  state,
  removeRef,
}: UseFixItParams) {
  const {
    pendingOpensRef,
    setAcceptingId,
    setActionError,
    fullyHide,
    notifyRequestClosed,
  } = state;

  const accepting = useRef(new Set<string>());

  return useCallback(
    async (j: JobRecord) => {
      if (!backendUserId || accepting.current.has(j.id)) return;
      accepting.current.add(j.id);
      setAcceptingId(j.id);
      setActionError(null);
      try {
        // Branch on the LIVE flow status, not pairingStage: a card that
        // already moved to negotiating (e.g. stale pairing stage left on the
        // record) must take the classic path, not fail the CONFIRM gate.
        if (PAIRING_ACTION_STAGES.has(j.status ?? "")) {
          const stage = j.pairingStage ?? "";
          const needsOpen =
            stage === "waiting_for_selected" || stage === "waiting_for_pro";
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
          if (needsOpen || pendingOpensRef.current.has(openRequestKey(j.id, backendUserId))) {
            const openRes = await ensureIncomingRequestOpen(j, backendUserId, pendingOpensRef.current);
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
          if (confirmRes.data.job.status !== "negotiating" || confirmRes.data.job.pairingStage) {
            setActionError("Request confirmation is still pending. Please try again.");
            return;
          }
          seedNegotiationScreen(j, confirmRes.data.job);
          fullyHide();
          router.push(`/jobs/${j.id}`);
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
      } catch {
        setActionError("Could not confirm this request. Please try again.");
      } finally {
        accepting.current.delete(j.id);
        setAcceptingId(null);
      }
    },
    [
      backendUserId,
      fullyHide,
      notifyRequestClosed,
      router,
      pendingOpensRef,
      removeRef,
      setAcceptingId,
      setActionError,
    ],
  );
}
