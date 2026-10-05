import { useCallback, useRef } from "react";
import { isSpecialtyPickerTrade } from "@/lib/artisan/catalog";
import type { AppFilters, ServiceCategory } from "@/lib/types";
import type { MarketStateResult } from "./use-market-state";

export function useFilters(market: MarketStateResult) {
  const {
    setCategoryState,
    setSpecialtyFilterState,
    setSpecialtyPickerOpen,
    setFilters,
  } = market;

  const toggleFilter = useCallback(
    (key: keyof AppFilters) => {
      setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [setFilters],
  );

  const specialtyHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearSpecialtyHideTimer = useCallback(() => {
    if (specialtyHideTimerRef.current) {
      clearTimeout(specialtyHideTimerRef.current);
      specialtyHideTimerRef.current = null;
    }
  }, []);

  const setCategory = useCallback(
    (c: ServiceCategory) => {
      clearSpecialtyHideTimer();
      setCategoryState(c);
      setSpecialtyFilterState(null);
      // Plumber / Carpenter / etc. → show specialty strip instead of radius
      setSpecialtyPickerOpen(isSpecialtyPickerTrade(c));
    },
    [
      clearSpecialtyHideTimer,
      setCategoryState,
      setSpecialtyFilterState,
      setSpecialtyPickerOpen,
    ],
  );

  const setSpecialtyFilter = useCallback(
    (s: string | null) => {
      clearSpecialtyHideTimer();
      setSpecialtyFilterState(s);
      if (s) {
        // Keep strip open so pick can highlight; hide after 2s, filter already applied
        setSpecialtyPickerOpen(true);
        specialtyHideTimerRef.current = setTimeout(() => {
          setSpecialtyPickerOpen(false);
          specialtyHideTimerRef.current = null;
        }, 2000);
      } else {
        setSpecialtyPickerOpen(false);
      }
    },
    [clearSpecialtyHideTimer, setSpecialtyFilterState, setSpecialtyPickerOpen],
  );

  const openSpecialtyPicker = useCallback(() => {
    clearSpecialtyHideTimer();
    setSpecialtyFilterState(null);
    setSpecialtyPickerOpen(true);
  }, [
    clearSpecialtyHideTimer,
    setSpecialtyFilterState,
    setSpecialtyPickerOpen,
  ]);
  return {
    toggleFilter,
    setCategory,
    setSpecialtyFilter,
    openSpecialtyPicker,
  };
}

export type FiltersResult = ReturnType<typeof useFilters>;
