"use client";

import { useEffect, useState } from "react";
import { MAX_TECHNICIANS } from "@/lib/matching";
import type { Technician } from "@/lib/types";

export const PAGE_SIZE = 10;

/** Repair Pro list paging: first page, "see more" and the hard cap. */
export function usePagedTechnicians(
  visibleTechnicians: Technician[],
  radiusKm: number,
) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [radiusKm, visibleTechnicians.length]);

  const total = Math.min(visibleTechnicians.length, MAX_TECHNICIANS);
  const list = visibleTechnicians.slice(0, Math.min(visibleCount, total));
  const canShowMore = list.length < total;

  const showMore = () =>
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, MAX_TECHNICIANS, total));

  return { total, list, canShowMore, showMore };
}
