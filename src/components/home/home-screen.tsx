"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/home/app-header";
import { HomePanel } from "@/components/home/home-panel";
import { useAppConfig } from "@/components/app-config-provider";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { useApp } from "@/lib/store";
import { MAX_TECHNICIANS } from "@/lib/matching";
import { cn } from "@/lib/utils";

/**
 * Customer home: the map shows as soon as the screen opens (no tap needed) and the
 * trade sheet sits over its lower part. Nearby pros refresh lives in AppProvider
 * (slow poll), not on every open.
 */
const ServiceMap = dynamic(
  () => import("@/components/map/service-map").then((m) => m.ServiceMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-ona-map text-sm text-ona-muted">
        Loading map…
      </div>
    ),
  },
);

export function HomeScreen() {
  const {
    visibleTechnicians,
    setSelectedTechId,
    selectedTechId,
    category,
    accountType,
    setCategory,
    authReady,
  } = useApp();
  const { config } = useAppConfig();
  /** Open with lower panel down (collapsed) map slot on top, sheet ~60% bottom */
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Rerouted from /request: `/?trade=mechanic` opens the trade's new
  // question-flow steps on the FIRST arrival (search / pro-profile "Request").
  // The param is consumed once and stripped from the URL so it can never
  // re-trigger on later visits. Without that deep-link intent (reload, Back,
  // menu tap, cold start) the customer home always opens on a blank trade
  // selector. Re-applies after auth boot so the deep-link survives the
  // session restore.
  const consumedTrade = useRef<string | null>(null);
  useEffect(() => {
    const trade = new URLSearchParams(window.location.search).get("trade");
    if (trade) consumedTrade.current = trade;
    if (consumedTrade.current) {
      const effective = consumedTrade.current;
      void import("@/lib/pro-service-id").then(({ isProService }) => {
        if (isProService(effective)) {
          setSelectedTechId(null);
          setCategory(effective);
        }
      });
      if (trade) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    } else {
      setSelectedTechId(null);
      setCategory("none");
    }
  }, [setCategory, setSelectedTechId, authReady]);

  // Start loading the map script and both map implementations as early as
  // possible so the street map paints straight away.
  useOnaGoogleMaps();
  useEffect(() => {
    void import("@/components/map/service-map");
    void import("@/components/map/osm-service-map");
  }, []);

  useEffect(() => {
    if (
      visibleTechnicians.length > 0 &&
      !visibleTechnicians.some((t) => t.id === selectedTechId)
    ) {
      setSelectedTechId(visibleTechnicians[0].id);
    }
  }, [visibleTechnicians, selectedTechId, setSelectedTechId]);

  if (config.app.maintenanceMode) {
    return (
      <div
        className={cn(
          "ona2 flex h-full flex-col items-center justify-center gap-3 px-6 text-center",
        )}
      >
        <p className="text-lg font-bold text-ona-ink">{config.app.name}</p>
        <p className="max-w-xs text-sm text-ona-muted">
          {config.app.maintenanceMessage}
        </p>
      </div>
    );
  }

  /** Customer, no trade open, sheet down: sheet shrinks to title + search. */
  const shortSheet =
    !sheetExpanded && accountType !== "professional" && category === "none";
  // Cap map pins hard tiles + markers are the main data cost
  const mapTechs = visibleTechnicians
    .filter((t) => t.status !== "offline")
    .slice(0, Math.min(4, MAX_TECHNICIANS));

  return (
    <div
      data-theme-toggle-ok
      className="ona2 relative flex h-full min-h-0 flex-col overflow-hidden"
    >
      {/* Floats over the map; sits in flow above the sheet when it is full-height */}
      <div
        className={cn(
          "z-40",
          sheetExpanded
            ? "relative shrink-0 bg-ona-bg"
            : "absolute inset-x-0 top-0",
        )}
      >
        <AppHeader />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          data-map-surface
          className={cn(
            "om-sheet-spring relative min-h-0 overflow-hidden",
            sheetExpanded
              ? "h-0 flex-[0_0_0%] opacity-0 pointer-events-none"
              : shortSheet
                ? "flex-1 opacity-100"
                : "flex-[0_0_40%] opacity-100",
          )}
        >
          {!sheetExpanded ? (
            <ServiceMap technicians={mapTechs} onSelect={setSelectedTechId} />
          ) : null}
        </div>

        <div
          data-theme-toggle-ok
          className={cn(
            "om-sheet-spring z-30 flex min-h-0 flex-col overflow-hidden bg-ona-surface",
            sheetExpanded
              ? "flex-1"
              : shortSheet
                ? "flex-[0_0_auto]"
                : "flex-[0_0_60%]",
            !sheetExpanded &&
              "rounded-t-ona-sheet shadow-[0_-6px_24px_rgba(17,24,39,0.12)]",
          )}
          style={{ touchAction: "pan-y" }}
        >
          <HomePanel
            expanded={sheetExpanded}
            onExpand={() => setSheetExpanded(true)}
            onCollapse={() => setSheetExpanded(false)}
            className="min-h-0 flex-1 bg-transparent pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          />
        </div>
      </div>
    </div>
  );
}
