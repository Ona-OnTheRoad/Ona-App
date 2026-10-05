import { useCallback, useEffect, useRef } from "react";
import { isProService } from "@/lib/pro-service-id";
import {
  backendFetchConversations,
  backendFetchJobsForUser,
  backendFetchPros,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { ServiceRequest } from "@/lib/types";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";
import type { ThemeAndProSheetResult } from "./use-theme-and-pro-sheet";
import type { ApplySessionResult } from "./use-apply-session";

export function useCloudData(
  session: SessionStateResult,
  market: MarketStateResult,
  themeApi: ThemeAndProSheetResult,
  applyApi: ApplySessionResult,
) {
  const {
    isAuthenticated,
    accountType,
    registeredAs,
    proServices,
    applySessionRef,
    applyAccountThemeRef,
    backendUserId,
  } = session;
  const { location, setRequests, setMessages, setCloudTechs } = market;
  const { applyAccountTheme } = themeApi;
  const { applySession } = applyApi;

  const refreshCloudProsRef = useRef<(opts?: { force?: boolean }) => void>(
    () => {},
  );
  // ── Supabase: load pros + jobs + chats + realtime (throttled) ─────
  const userLat = location.coordinates.lat;
  const userLng = location.coordinates.lng;

  const prosFetchLock = useRef(false);
  const lastProsFetchAt = useRef(0);
  const prosForcePending = useRef(false);

  /**
   * @param force Live/Away Realtime: bypass the normal 3.5s debounce so
   * customers see a pro appear/disappear without a full page refresh.
   */
  const refreshCloudPros = useCallback(
    (opts?: { force?: boolean }) => {
      // Client Marketplace: motorists see full feed; an active Repair Pro only
      // sees their own primary trade (scoped server-side in /api/pros).
      // Guests / login screens must not burn mobile data on map lists.
      if (!isAuthenticated) {
        setCloudTechs(null);
        return;
      }
      const force = Boolean(opts?.force);
      const now = Date.now();
      if (prosFetchLock.current) {
        if (force) prosForcePending.current = true;
        return;
      }
      // Dedupe stacked polls / GPS heartbeats (data saver)
      if (!force && now - lastProsFetchAt.current < 5_000) {
        return;
      }
      prosFetchLock.current = true;
      lastProsFetchAt.current = now;
      const trade =
        accountType === "professional"
          ? isProService(registeredAs)
            ? registeredAs
            : (proServices[0] ?? null)
          : null;
      // /api/pros returns only Live Repair Pros (online + pro role + range); for
      // pros that is further scoped to their own trade (server-side).
      void backendFetchPros({ lat: userLat, lng: userLng }, { trade })
        .then((list) => {
          // [] is valid: no one is Live right now (do not re-show demo seeds)
          setCloudTechs(list);
        })
        .catch((e) => {
          console.warn("[ona] refreshCloudPros failed", e);
        })
        .finally(() => {
          prosFetchLock.current = false;
          if (prosForcePending.current) {
            prosForcePending.current = false;
            window.setTimeout(() => {
              refreshCloudProsRef.current({ force: true });
            }, 300);
          }
        });
    },
    [
      userLat,
      userLng,
      accountType,
      isAuthenticated,
      registeredAs,
      proServices,
      setCloudTechs,
    ],
  );

  // Keep late-bound refs in sync without breaking React Compiler memoization
  useEffect(() => {
    applyAccountThemeRef.current = applyAccountTheme;
  }, [applyAccountTheme, applyAccountThemeRef]);
  useEffect(() => {
    applySessionRef.current = applySession;
  }, [applySession, applySessionRef]);
  useEffect(() => {
    refreshCloudProsRef.current = refreshCloudPros;
  }, [refreshCloudPros]);

  /** Public: motorist empty-state Refresh pros list only */
  const refreshNearbyPros = useCallback(() => {
    refreshCloudPros({ force: true });
  }, [refreshCloudPros]);

  const refreshCloudJobs = useCallback(() => {
    if (!isAppBackendOnline() || !backendUserId || !accountType) return;
    void backendFetchJobsForUser(backendUserId, accountType)
      .then((jobs) => {
        if (jobs.length === 0) return;
        setRequests((prev) => {
          // Cheap signature avoid JSON.stringify of full job trees every poll
          const sig = (list: ServiceRequest[]) =>
            list
              .map(
                (j) =>
                  `${j.id}:${j.status}:${j.createdAt}:${j.escrowStatus || ""}:${j.paymentReference || ""}:${j.negotiationStatus || ""}:${j.labourAgreedMajor ?? ""}`,
              )
              .join("|");
          return sig(prev) === sig(jobs) ? prev : jobs;
        });
      })
      .catch((e) => {
        console.warn("[ona] refreshCloudJobs failed", e);
      });
  }, [backendUserId, accountType, setRequests]);

  const refreshCloudChats = useCallback(() => {
    if (!isAppBackendOnline() || !backendUserId || !accountType) return;
    void backendFetchConversations(backendUserId, accountType).then(
      (threads) => {
        if (threads.length > 0) setMessages(threads);
      },
    );
  }, [backendUserId, accountType, setMessages]);

  // Account isolation: never let the previous user's jobs/chats bleed into the
  // next account on the same browser (two separate pros sharing accept state).
  const prevJobsUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (prevJobsUserId.current !== backendUserId) {
      prevJobsUserId.current = backendUserId;
      setRequests([]);
      setMessages([]);
    }
  }, [backendUserId, setMessages, setRequests]);
  return {
    userLat,
    userLng,
    refreshCloudPros,
    refreshNearbyPros,
    refreshCloudJobs,
    refreshCloudChats,
  };
}

export type CloudDataResult = ReturnType<typeof useCloudData>;
