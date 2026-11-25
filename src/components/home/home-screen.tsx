"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EdgeToEdgeTop } from "@/components/layout/edge-to-edge-top";
import { AppHeader } from "@/components/home/app-header";
import { HomePanel } from "@/components/home/home-panel";
import { useAppConfig } from "@/components/app-config-provider";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { useT } from "@/lib/i18n";
import { shouldDeferHeavyContent } from "@/lib/network/connection";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { useApp } from "@/lib/store";
import { MAX_TECHNICIANS } from "@/lib/matching";
import { cn } from "@/lib/utils";

/**
 * Customer home: the map shows as soon as the screen opens (no tap needed) and
 * the trade sheet sits over its lower part. On 2G / Data Saver / offline the map waits for
 * a tap so poor connections are not burdened with imagery. Nearby pros refresh lives in
 * AppProvider (slow poll), not on every open.
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
  const t = useT();
  const network = useNetworkStatus();
  const deferMap = shouldDeferHeavyContent(network);
  /** On a poor connection the person chose to load the map this visit. */
  const [mapRequested, setMapRequested] = useState(false);
  /** Open with lower panel down (collapsed) map slot on top, sheet ~75% bottom (a trade flow needs the room) */
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
          "ona2 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center",
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
  /**
   * Customer opened a trade (Mechanic, Plumber…): the question flow gets the whole screen so it
   * never scrolls inside a small box (also when the trade was picked from the opened grid, which
   * leaves the sheet "expanded"). The map stays mounted (no reload on Back) but collapses to 0.
   */
  const tradeFlowFull = accountType !== "professional" && category !== "none";
  // Cap map pins hard tiles + markers are the main data cost
  const mapTechs = visibleTechnicians
    .filter((t) => t.status !== "offline")
    .slice(0, Math.min(4, MAX_TECHNICIANS));

  return (
    <div
      data-theme-toggle-ok
      className="ona2 relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {/* The map runs behind the status bar / Dynamic Island; the header below pads itself. */}
      <EdgeToEdgeTop />
      {/* Always floats over the map, also with the sheet fully open (a slice of map stays visible) */}
      <div
        className={cn(
          "z-40 pt-[env(safe-area-inset-top,0px)]",
          tradeFlowFull
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
            // Sheet fully open: the map shrinks to a peek, it is never hidden.
            tradeFlowFull
              ? "pointer-events-none flex-[0_0_0%] opacity-0"
              : sheetExpanded
                ? "flex-[0_0_40%] opacity-100"
                : shortSheet
                  ? "flex-1 opacity-100"
                  : "flex-[0_0_25%] opacity-100",
          )}
        >
          {/* Soft fade so the clock / signal icons stay readable over the map (zero height
              when there is no inset, e.g. a desktop browser) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[35] h-[calc(env(safe-area-inset-top,0px)*1.6)] bg-gradient-to-b from-black/40 to-transparent"
          />
          {!deferMap || mapRequested ? (
            <ServiceMap technicians={mapTechs} onSelect={setSelectedTechId} />
          ) : (
            <button
              type="button"
              disabled={!network.online}
              onClick={() => setMapRequested(true)}
              className="flex h-full w-full flex-col items-center justify-center gap-2 border-0 bg-ona-map px-4 text-center text-ona-ink disabled:opacity-80"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ona-border bg-ona-surface text-ona-brand-ink">
                <MapPin className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="text-[14px] font-semibold">
                {network.online
                  ? t("home.mapSaverTitle")
                  : t("home.mapOfflineTitle")}
              </span>
              <span className="text-[12px] text-ona-muted">
                {network.online
                  ? t("home.mapSaverBody")
                  : t("home.mapOfflineBody")}
              </span>
            </button>
          )}
        </div>

        <div
          data-theme-toggle-ok
          className={cn(
            "om-sheet-spring z-30 flex min-h-0 flex-col overflow-hidden bg-ona-surface",
            sheetExpanded || tradeFlowFull
              ? "flex-1"
              : shortSheet
                ? "flex-[0_0_auto]"
                : "flex-[0_0_75%]",
            !tradeFlowFull &&
              "rounded-t-ona-sheet shadow-[0_-6px_24px_rgba(17,24,39,0.12)]",
          )}
          style={{ touchAction: "pan-y" }}
        >
          <HomePanel
            expanded={sheetExpanded}
            onExpand={() => setSheetExpanded(true)}
            onCollapse={() => setSheetExpanded(false)}
            className={cn(
              "min-h-0 bg-transparent pb-1",
              !shortSheet && "flex-1",
            )}
          />
        </div>
      </div>
    </div>
  );
}
