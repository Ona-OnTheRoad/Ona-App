import { useEffect } from "react";
import {
  backendSubscribeJobs,
  backendSubscribePros,
  backendSubscribeUserMessageInserts,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";
import type { CloudDataResult } from "./use-cloud-data";

export function useCloudRealtime(
  session: SessionStateResult,
  market: MarketStateResult,
  cloudApi: CloudDataResult,
) {
  const { isAuthenticated, accountType, backendUserId } = session;
  const { setCloudTechs } = market;
  const { refreshCloudPros, refreshCloudJobs, refreshCloudChats } = cloudApi;

  // Marketplace (motorist full feed / pro own-trade feed):
  // Realtime presence is primary; poll is backup only.
  useEffect(() => {
    if (!isAuthenticated) {
      setCloudTechs(null);
      return;
    }
    // Role switch should never leave a stale-scope feed behind. /api/pros
    // re-scopes server-side, but drop old results so a pro never sees the
    // motorist feed (and vice versa) between switch and refetch.
    setCloudTechs(null);
    const first = window.setTimeout(
      () => refreshCloudPros({ force: true }),
      100,
    );
    // Backup if Realtime drops Realtime is primary (keep map/presence snappy)
    const poll = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      refreshCloudPros();
    }, 45_000);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        refreshCloudPros({ force: true });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshCloudPros, isAuthenticated, accountType, setCloudTechs]);

  // Pros Realtime via public pro_presence Live/Away without page refresh
  // (motorists see the full feed; pros see their own-trade subset both
  // derive from the same realtime stream and re-scope server-side on fetch).
  useEffect(() => {
    if (!isAppBackendOnline() || !backendUserId || !isAuthenticated) {
      return;
    }
    let prosTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubPros = backendSubscribePros((reason) => {
      if (prosTimer) clearTimeout(prosTimer);
      // Live/Away: near-instant. GPS heartbeat: short coalesce only.
      const delay = reason === "heartbeat" ? 1_200 : 200;
      prosTimer = setTimeout(() => {
        refreshCloudPros({ force: reason === "presence" });
      }, delay);
    });
    return () => {
      if (prosTimer) clearTimeout(prosTimer);
      unsubPros?.();
    };
  }, [backendUserId, accountType, isAuthenticated, refreshCloudPros]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Jobs soon after auth; chats only as rare backup (Realtime is primary)
    const jobsT = window.setTimeout(() => refreshCloudJobs("initial"), 900);
    const chatsT = window.setTimeout(() => refreshCloudChats(), 600_000);
    return () => {
      window.clearTimeout(jobsT);
      window.clearTimeout(chatsT);
    };
  }, [refreshCloudJobs, refreshCloudChats, isAuthenticated]);

  // Jobs Realtime near-instant customer ↔ pro job updates
  useEffect(() => {
    if (!isAppBackendOnline() || !backendUserId || !isAuthenticated) return;
    let jobsTimer: ReturnType<typeof setTimeout> | null = null;
    let lastStaleSweep = 0;
    const scheduleRealtimeRefresh = () => {
      if (jobsTimer) clearTimeout(jobsTimer);
      jobsTimer = setTimeout(() => refreshCloudJobs("realtime"), 800);
    };
    const unsubJobs = backendSubscribeJobs(
      backendUserId,
      scheduleRealtimeRefresh,
      "cloud-store",
      (state, meta) => {
        if (state === "connected" && meta.reconnected) {
          scheduleRealtimeRefresh();
        }
      },
    );
    // First stale sweep once after open (not on every jobs poll)
    const staleTimer = window.setTimeout(() => {
      lastStaleSweep = Date.now();
      import("@/lib/jobs/client")
        .then((m) => m.apiExpireStaleBookedJobs({ source: "cloud-store", trigger: "initial" }))
        .catch((e) => console.warn("[ona] expire-stale (open)", e));
    }, 12_000);
    // Backup poll if Realtime drops (pairing screens still poll locally / job page)
    const poll = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      refreshCloudJobs("interval");
      const now = Date.now();
      // Expire-stale is heavy (DB sweeps + pairing + payout) keep rare
      if (now - lastStaleSweep >= 240_000) {
        lastStaleSweep = now;
        import("@/lib/jobs/client")
          .then((m) => m.apiExpireStaleBookedJobs({ source: "cloud-store", trigger: "interval" }))
          .catch((e) => console.warn("[ona] expire-stale (poll)", e));
      }
    }, 120_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refreshCloudJobs("visibility");
    };
    const onOnline = () => {
      refreshCloudJobs("visibility");
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      if (jobsTimer) clearTimeout(jobsTimer);
      unsubJobs?.();
      window.clearTimeout(staleTimer);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [backendUserId, isAuthenticated, accountType, refreshCloudJobs]);

  // Messages Realtime refresh threads so inbound banner / toast can fire
  useEffect(() => {
    if (!isAppBackendOnline() || !backendUserId || !isAuthenticated) return;
    let chatTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = backendSubscribeUserMessageInserts(backendUserId, () => {
      if (chatTimer) clearTimeout(chatTimer);
      chatTimer = setTimeout(() => refreshCloudChats(), 600);
    });
    // Rare backup chat Realtime + open thread poll stay primary
    const poll = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      refreshCloudChats();
    }, 240_000);
    return () => {
      if (chatTimer) clearTimeout(chatTimer);
      unsub?.();
      window.clearInterval(poll);
    };
  }, [backendUserId, isAuthenticated, refreshCloudChats]);
}
