import { useEffect, useMemo, useState } from "react";
import { filterAndRankTechnicians } from "@/lib/matching";
import { isProService } from "@/lib/pro-service-id";
import { haversineKm } from "@/lib/supabase/mappers";
import type { ServiceCategory } from "@/lib/types";
import { SELF_PRO_TECH_ID } from "./constants";
import { profileToTechnician } from "./technician";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";

export function useTechnicians(
  session: SessionStateResult,
  market: MarketStateResult,
) {
  const { accountType, userProfile, registeredAs, proServices, backendUserId } =
    session;
  const {
    location,
    radiusKm,
    category,
    specialtyFilter,
    query,
    filters,
    cloudTechs,
  } = market;

  /** Live marketplace pros only (no demo seed keeps first paint light). */
  const technicians = useMemo(() => {
    // Marketplace: only server Live pros (is_online + repair_pro role).
    // /api/pros is role-aware: an active Repair Pro only ever receives their
    // own trade's Live pros (server-side), so pros use the same feed too.
    const base = cloudTechs !== null ? cloudTechs : [];

    // Always recompute distance/ETA from the active pin (my GPS or
    // “help someone else” meet location) so radius is correct for both.
    const origin = location.coordinates;
    const withDistance = base.map((t) => {
      const lat = t.location?.lat;
      const lng = t.location?.lng;
      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        // No coords → treat as out of range so they never appear in 5 km list
        return { ...t, distanceKm: Number.POSITIVE_INFINITY };
      }
      const d = haversineKm(origin, { lat, lng });
      // Prefer Google ETA from API when present; never force a 5-6 min floor
      const estimate =
        d <= 0.12 ? 1 : d <= 0.3 ? 2 : Math.max(1, Math.round((d / 28) * 60));
      const fromApi =
        typeof t.etaMinutes === "number" &&
        Number.isFinite(t.etaMinutes) &&
        t.etaMinutes > 0 &&
        t.etaMinutes < 90;
      return {
        ...t,
        distanceKm: Math.round(d * 10) / 10,
        etaMinutes: fromApi ? t.etaMinutes : estimate,
      };
    });

    // Motorist home: never inject the signed-in Repair Pro into discovery
    // (they look for other pros). Pro self-card stays for pro dashboard only.
    if (accountType === "motorist" || accountType == null) {
      return withDistance.filter(
        (t) => t.id !== SELF_PRO_TECH_ID && t.id !== backendUserId,
      );
    }

    const self = userProfile ? profileToTechnician(userProfile) : null;
    if (!self) return withDistance;
    return [
      self,
      ...withDistance.filter(
        (t) => t.id !== SELF_PRO_TECH_ID && t.id !== self.id,
      ),
    ];
  }, [
    userProfile,
    cloudTechs,
    location.coordinates.lat,
    location.coordinates.lng,
    backendUserId,
  ]);

  /** Recently booked → 50% less radius priority; active jobs → hide from list */
  const [discoveryExcludeProIds, setDiscoveryExcludeProIds] = useState<
    string[]
  >([]);
  const [discoveryDemoteProIds, setDiscoveryDemoteProIds] = useState<string[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const refreshDiscoveryPriority = async () => {
      try {
        const { getRadiusDemoteProIds } =
          await import("@/lib/jobs/booked-pro-priority");
        if (!cancelled) setDiscoveryDemoteProIds(getRadiusDemoteProIds());
      } catch {
        if (!cancelled) setDiscoveryDemoteProIds([]);
      }

      // Never hide previously requested pros from the list customer can
      // New request only when no open job; open jobs show "Open" on the card.
      if (!cancelled) setDiscoveryExcludeProIds([]);
    };
    void refreshDiscoveryPriority();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refreshDiscoveryPriority();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      cancelled = true;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, [backendUserId, accountType]);

  const visibleTechnicians = useMemo(() => {
    // Dual-role: never show own Repair Pro pin when browsing as Customer
    const exclude = new Set(
      Array.from(discoveryExcludeProIds || []).map((id) => String(id)),
    );
    if (backendUserId) exclude.add(String(backendUserId));
    // An active Repair Pro's market is pinned to their own primary trade
    // (server-enforced). Pin the client category too so search / filters stay
    // inside that trade and the category tab cannot widen the feed.
    const effectiveCategory: ServiceCategory =
      accountType === "professional"
        ? ((isProService(registeredAs) ? registeredAs : proServices[0]) ??
          "all")
        : category;
    return filterAndRankTechnicians(technicians, {
      radiusKm,
      category: effectiveCategory,
      query,
      filters,
      specialtyFilter,
      excludeProIds: exclude,
      // Demote even while excluded so when job closes ranking stays soft
      radiusDemoteProIds: discoveryDemoteProIds,
    });
  }, [
    technicians,
    radiusKm,
    category,
    query,
    filters,
    specialtyFilter,
    discoveryExcludeProIds,
    discoveryDemoteProIds,
    backendUserId,
    accountType,
    registeredAs,
    proServices,
  ]);
  return {
    technicians,
    visibleTechnicians,
  };
}

export type TechniciansResult = ReturnType<typeof useTechnicians>;
