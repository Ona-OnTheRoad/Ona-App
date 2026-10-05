import { useEffect } from "react";
import {
  backendGetProOnline,
  backendSetProOnline,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { SessionStateResult } from "./use-session-state";
import type { CloudDataResult } from "./use-cloud-data";

export function useProLiveSync(
  session: SessionStateResult,
  cloudApi: CloudDataResult,
) {
  const { accountType, proLive, setProLiveState, backendUserId } = session;
  const { userLat, userLng } = cloudApi;

  // Sync Live/Away from server (never trust localStorage alone Away must match is_online)
  useEffect(() => {
    if (accountType !== "professional" || !backendUserId) return;
    if (!isAppBackendOnline()) return;
    let cancelled = false;
    void backendGetProOnline(backendUserId).then((online) => {
      if (cancelled || online == null) return;
      setProLiveState(online);
      try {
        localStorage.setItem("ona-pro-live", online ? "1" : "0");
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountType, backendUserId, setProLiveState]);

  // While Live: continuous GPS so motorists get accurate 5 km / 2 km discovery
  useEffect(() => {
    if (
      !isAppBackendOnline() ||
      !backendUserId ||
      accountType !== "professional" ||
      !proLive
    ) {
      return;
    }

    let lastPush = 0;
    let inflight = false;
    /** Heartbeat every ~2 min so marketplace 5-min window has margin for one miss */
    const LIVE_HEARTBEAT_MS = 2 * 60 * 1000;
    const pushCoords = (lat: number, lng: number) => {
      const now = Date.now();
      if (inflight || now - lastPush < LIVE_HEARTBEAT_MS - 5_000) return;
      lastPush = now;
      inflight = true;
      void backendSetProOnline(backendUserId, true, { lat, lng }).finally(
        () => {
          inflight = false;
        },
      );
    };

    // One initial pin, then heartbeat interval (no watchPosition stream)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => pushCoords(pos.coords.latitude, pos.coords.longitude),
        () => pushCoords(userLat, userLng),
        {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: LIVE_HEARTBEAT_MS,
        },
      );
    } else {
      pushCoords(userLat, userLng);
    }

    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!navigator.geolocation) {
        pushCoords(userLat, userLng);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => pushCoords(pos.coords.latitude, pos.coords.longitude),
        () => pushCoords(userLat, userLng),
        {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: LIVE_HEARTBEAT_MS,
        },
      );
    }, LIVE_HEARTBEAT_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [backendUserId, accountType, userLat, userLng, proLive]);

  // Leaving pro mode → Away (so motorists don't see them while on Customer)
  useEffect(() => {
    if (accountType === "professional") return;
    if (!backendUserId || !isAppBackendOnline()) return;
    if (proLive) {
      setProLiveState(false);
      try {
        localStorage.setItem("ona-pro-live", "0");
      } catch {
        /* ignore */
      }
      void backendSetProOnline(backendUserId, false);
    }
  }, [accountType, backendUserId, proLive, setProLiveState]);
}
