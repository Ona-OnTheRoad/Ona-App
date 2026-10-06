import { useEffect, useState } from "react";
import { MAX_RADIUS_KM } from "@/lib/matching";
import { readSession, writeSession } from "@/lib/session-restore";
import { HOME_UI_SESSION_KEY, defaultFilters } from "./constants";
import { isCategory } from "./storage";
import type { HomeUiSnapshot } from "./types";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";

export function useHomeUiSession(
  session: SessionStateResult,
  market: MarketStateResult,
) {
  const {
    authReady,
    helpingSomeoneElse,
    setHelpingSomeoneElseState,
    helpingSomeoneLabel,
    setHelpingSomeoneLabel,
  } = session;
  const {
    radiusKm,
    setRadiusKmState,
    category,
    setCategoryState,
    specialtyFilter,
    setSpecialtyFilterState,
    specialtyPickerOpen,
    setSpecialtyPickerOpen,
    query,
    setQuery,
    filters,
    setFilters,
    selectedTechId,
    setSelectedTechId,
  } = market;

  /** True once the home-screen session has been (or tried to be) re-applied. */
  const [homeUiHydrated, setHomeUiHydrated] = useState(false);
  // Keep the home screen exactly where the user was restore after auth boots
  // so role-aware rendering (Motorist vs Repair Pro) decides what is shown.
  useEffect(() => {
    if (!authReady || homeUiHydrated) return;
    const snap = readSession<HomeUiSnapshot>(HOME_UI_SESSION_KEY);
    if (snap) {
      if (isCategory(snap.category)) setCategoryState(snap.category);
      if (typeof snap.radiusKm === "number" && snap.radiusKm > 0) {
        setRadiusKmState(Math.min(MAX_RADIUS_KM, Math.max(1, snap.radiusKm)));
      }
      if (snap.filters && typeof snap.filters === "object") {
        setFilters({ ...defaultFilters, ...snap.filters });
      }
      if (typeof snap.query === "string") setQuery(snap.query);
      if (typeof snap.specialtyFilter === "string") {
        setSpecialtyFilterState(snap.specialtyFilter);
      }
      if (typeof snap.specialtyPickerOpen === "boolean") {
        setSpecialtyPickerOpen(snap.specialtyPickerOpen);
      }
      if (typeof snap.selectedTechId === "string") {
        setSelectedTechId(snap.selectedTechId);
      }
      if (typeof snap.helpingSomeoneElse === "boolean") {
        setHelpingSomeoneElseState(snap.helpingSomeoneElse);
      }
      if (typeof snap.helpingSomeoneLabel === "string") {
        setHelpingSomeoneLabel(snap.helpingSomeoneLabel);
      }
    }
    setHomeUiHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  // Keep the snapshot fresh only after the saved position has been applied.
  useEffect(() => {
    if (!homeUiHydrated) return;
    writeSession(HOME_UI_SESSION_KEY, {
      category,
      radiusKm,
      filters,
      query,
      specialtyFilter,
      specialtyPickerOpen,
      selectedTechId,
      helpingSomeoneElse,
      helpingSomeoneLabel,
    });
  }, [
    homeUiHydrated,
    category,
    radiusKm,
    filters,
    query,
    specialtyFilter,
    specialtyPickerOpen,
    selectedTechId,
    helpingSomeoneElse,
    helpingSomeoneLabel,
  ]);
}
