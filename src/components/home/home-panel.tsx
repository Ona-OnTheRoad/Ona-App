"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilterChips } from "@/components/home/filter-chips";
import { NeedHelpDialogue } from "@/components/home/need-help-dialogue";
import { RadiusSlider } from "@/components/home/radius-slider";
import { SpecialtyFilterBar } from "@/components/home/specialty-filter-bar";
import { shouldUseLiveMaps } from "@/lib/google-maps";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { HomeVerifyPanel } from "@/components/auth/verification-gate-banner";
import { useMotoristJobsByPro } from "@/lib/jobs/use-motorist-jobs-by-pro";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { Technician } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CustomerOpenJobs } from "@/components/home/customer-open-jobs";
import { talkBoxAfterTradePick } from "@/components/home/need-help-steps";
import { shouldShowHomeVerifyPanel } from "@/lib/verification-gate";
import {
  HelpFlowOutlet,
  hasHelpFlow,
} from "@/components/home/home-panel/help-flow-outlet";
import {
  ExpressResumeCard,
  LocationErrorBanner,
  OpenRequestNotice,
  ProEmptyState,
} from "@/components/home/home-panel/home-notices";
import { HomeTopStrip } from "@/components/home/home-panel/home-top-strip";
import { SheetPill } from "@/components/home/home-panel/sheet-pill";
import { ProTechList } from "@/components/home/home-panel/pro-tech-list";
import { useHelpSomeone } from "@/components/home/home-panel/use-help-someone";
import { usePagedTechnicians } from "@/components/home/home-panel/use-paged-technicians";
import { usePendingExpress } from "@/components/home/home-panel/use-pending-express";
import { useSheetGestures } from "@/components/home/home-panel/use-sheet-gestures";
import { useVerifyPanelReady } from "@/components/home/home-panel/use-verify-panel-ready";

/**
 * Motorist lower sheet: trade strip + list always visible.
 * Chevron / swipe-left swaps only the top strip for a quiet
 * “Where are they?” Places field no separate page.
 */
export function HomePanel({
  expanded,
  onExpand,
  onCollapse,
  className,
  footer,
}: {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  className?: string;
  footer?: ReactNode;
}) {
  const router = useRouter();
  const t = useT();

  const {
    visibleTechnicians,
    radiusKm,
    specialtyPickerOpen,
    setSelectedTechId,
    selectedTechId,
    locationError,
    retryLocation,
    theme,
    accountType,
    isAuthenticated,
    refreshNearbyPros,
    helpingSomeoneElse,
    userProfile,
    category,
    setCategory,
  } = useApp();
  const isLight = theme === "light";
  const [refreshingPros, setRefreshingPros] = useState(false);
  const verifyPanelReady = useVerifyPanelReady();

  /** Address confirmed → show trade strip under the field (no chip). */
  const addressConfirmed = helpingSomeoneElse;

  const isMotorist = isAuthenticated && accountType === "motorist";

  /** Repair Pro: market shows ONLY their primary trade. */
  const isProMode = accountType === "professional";

  /** Talk box only after they tap a trade. Never for Repair Pro. */
  const tradeChosen = talkBoxAfterTradePick(category);
  const isFlow = hasHelpFlow(category, isProMode);
  /** Trade grid showing: its block scrolls inside the sheet on short phones. */
  const gridMode = !isProMode && category === "none" && expanded;
  const showTalkBox = !isProMode && tradeChosen && !isFlow;

  /**
   * Lower panel only: every home open when phone is still unverified
   * after the 30-day free window from first request. Hidden once phone is verified.
   */
  const showVerifyPanel =
    isMotorist && shouldShowHomeVerifyPanel(userProfile, accountType);
  const verifyMessage = showVerifyPanel
    ? "Verify your phone number to request help"
    : null;

  const liveMaps = shouldUseLiveMaps();
  // Same loader options as every other map surface never apiKey "disabled"
  // (that crashed re-search after pro decline with different loader options).
  const { isLoaded: mapsLoaded } = useOnaGoogleMaps();

  const { byPro: jobsByPro, openJobs } = useMotoristJobsByPro();

  const handleRequest = (tech: Technician) => {
    setSelectedTechId(tech.id);
    // Direct-request page is gone open the trade's new question-flow steps.
    setCategory(tech.serviceType);
  };

  const handleOpenJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const { pendingExpress, openNotice, setOpenNotice } = usePendingExpress({
    isProMode,
    category,
    setCategory,
  });

  const openExpressResume = () => {
    if (!pendingExpress) return;
    window.sessionStorage.setItem(
      "ona-express-resume",
      JSON.stringify(pendingExpress),
    );
    router.push("/express?resume=1");
  };

  const { total, list, canShowMore, showMore } = usePagedTechnicians(
    visibleTechnicians,
    radiusKm,
  );

  const help = useHelpSomeone({ isMotorist, mapsLoaded, liveMaps });
  const { onSheetWheel, onPillTouchStart, onPillTouchMove, onPillClick } =
    useSheetGestures({ expanded, onExpand, onCollapse });

  const hasExtraContent = Boolean(
    (showVerifyPanel && verifyPanelReady) ||
      (!isProMode && openNotice) ||
      (!isProMode && pendingExpress) ||
      (!isProMode && openJobs.length > 0) ||
      isFlow ||
      showTalkBox ||
      (isProMode && list.length > 0),
  );

  return (
    <div className={cn("relative z-30 flex min-h-0 flex-col", className)}>
      <div
        onWheel={onSheetWheel}
        className={gridMode ? "flex min-h-0 flex-col" : "shrink-0"}
      >
        <SheetPill
          expanded={expanded}
          onExpand={onExpand}
          onCollapse={onCollapse}
          onClick={onPillClick}
          onTouchStart={onPillTouchStart}
          onTouchMove={onPillTouchMove}
        />

        <div
          className={
            gridMode
              ? "min-h-0 overflow-y-auto overscroll-contain scrollbar-hide"
              : undefined
          }
        >
          <HomeTopStrip
            isLight={isLight}
            isProMode={isProMode}
            isMotorist={isMotorist}
            addressConfirmed={Boolean(addressConfirmed)}
            expanded={expanded}
            onExpand={onExpand}
            onCollapse={onCollapse}
            help={help}
          />

          {/* Mechanic / Vulcanizer / Tow / Battery / A/C / Body / Electric / Scan / Fashion / Plumber / Carpenter / Painter / Solar / Generator: no radius Repair Pro is found by urgency. */}
          {isProMode || (tradeChosen && !isFlow) ? <RadiusSlider /> : null}
          {isProMode && specialtyPickerOpen ? <SpecialtyFilterBar /> : null}
          {isProMode ? <FilterChips /> : null}
        </div>
      </div>

      {locationError && (
        <LocationErrorBanner message={locationError} onRetry={retryLocation} />
      )}

      {isProMode && list.length === 0 && !showVerifyPanel && (
        <ProEmptyState
          refreshing={refreshingPros}
          onRefresh={() => {
            setRefreshingPros(true);
            retryLocation();
            window.setTimeout(() => {
              refreshNearbyPros();
              setRefreshingPros(false);
            }, 1500);
          }}
        />
      )}

      {/* Talk box: no scroll. Repair Pro list may scroll. */}
      {hasExtraContent ? (
        <div
          className={cn(
            "min-h-0 flex-1 px-4 pb-0",
            showTalkBox || isFlow
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto overscroll-contain scrollbar-hide",
          )}
        >
          {showVerifyPanel && verifyPanelReady ? (
            <div className="mb-2 shrink-0">
              <HomeVerifyPanel message={verifyMessage} isLight={isLight} />
            </div>
          ) : null}
          {!isProMode && openNotice ? (
            <OpenRequestNotice onDismiss={() => setOpenNotice(false)} />
          ) : null}

          {!isProMode && pendingExpress ? (
            <ExpressResumeCard
              pending={pendingExpress}
              onResume={openExpressResume}
            />
          ) : null}

          {!isProMode && openJobs.length > 0 ? (
            <div className="shrink-0 pt-2.5">
              <CustomerOpenJobs
                jobs={openJobs}
                isLight={isLight}
                onOpen={handleOpenJob}
              />
            </div>
          ) : null}
          {isFlow ? (
            <HelpFlowOutlet
              category={category}
              isLight={isLight}
              onExit={() => setCategory("none")}
            />
          ) : showTalkBox ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <NeedHelpDialogue isLight={isLight} />
            </div>
          ) : (
            isProMode &&
            list.length > 0 && (
              <ProTechList
                list={list}
                total={total}
                canShowMore={canShowMore}
                radiusKm={radiusKm}
                selectedTechId={selectedTechId}
                jobsByPro={jobsByPro}
                onSelect={setSelectedTechId}
                onRequest={handleRequest}
                onOpenJob={handleOpenJob}
                onShowMore={showMore}
              />
            )
          )}

          {isProMode && !expanded && list.length > 0 && (
            <p className="py-2 text-center text-[11px] text-ona-muted">
              {t("home.swipeHint")}
            </p>
          )}
        </div>
      ) : null}

      {footer}
    </div>
  );
}
