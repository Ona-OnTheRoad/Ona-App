"use client";

import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDivider } from "./job-problem-qa/chevron-divider";
import {
  filterHiddenVehicleRows,
  stripCoordinateLocations,
} from "./job-problem-qa/filters";
import { parseJobProblem } from "./job-problem-qa/parse";

export {
  COORDINATES_ONLY_RE,
  customerWaitingHighlights,
  filterHiddenVehicleRows,
  stripCoordinateLocations,
} from "./job-problem-qa/filters";
export {
  parseJobProblem,
  type JobProblemRow,
  type ParsedJobProblem,
} from "./job-problem-qa/parse";

export function JobProblemQA({
  problem,
  isLight,
  transparent = false,
  compact = false,
  pageSize,
  hideVehicleRow = false,
}: {
  problem: string;
  isLight: boolean;
  /** Plain-text rows on the theme color no row cards or summary highlight. */
  transparent?: boolean;
  /** Customer list: full Q&A, tight gaps, no Next. */
  compact?: boolean;
  /** When set, page through the Q&A `pageSize` rows at a time. */
  pageSize?: number;
  /** Pro lower-panel only: the vehicle is already the card title. */
  hideVehicleRow?: boolean;
}) {
  const parsed = useMemo(() => {
    const p = parseJobProblem(problem);
    return { ...p, rows: stripCoordinateLocations(p.rows) };
  }, [problem]);
  const [offset, setOffset] = useState(0);
  const ink = isLight ? "text-slate-900" : "text-white";
  const rowCard = isLight ? "bg-black/[0.02]" : "bg-white/[0.02]";

  const baseRows = filterHiddenVehicleRows(parsed.rows, hideVehicleRow);

  if (!baseRows.length && !parsed.summary && !parsed.notes.length) {
    return (
      <p className={cn("text-[15px] font-medium leading-relaxed", ink)}>
        {problem}
      </p>
    );
  }

  const allItems = [
    ...baseRows,
    ...parsed.notes.map((note) => ({ label: "Location", answer: note })),
  ];
  const items =
    pageSize && !compact ? allItems.slice(offset, offset + pageSize) : allItems;
  const hasMore = Boolean(
    !compact && pageSize && offset + pageSize < allItems.length,
  );
  const advance = () =>
    setOffset((o) => Math.min(o + (pageSize || 0), allItems.length));
  const retreat = () => setOffset((o) => Math.max(o - (pageSize || 0), 0));

  const questionCls = cn(
    compact
      ? "text-[11.5px] font-semibold leading-tight"
      : "text-[13px] font-semibold leading-snug",
    isLight ? "text-slate-700" : "text-white/75",
  );
  const answerCls = cn(
    compact
      ? "mt-px text-[12.5px] font-bold leading-tight"
      : transparent
        ? "mt-0.5"
        : "mt-1",
    compact ? "" : "text-[15px] font-bold leading-snug",
    ink,
  );

  const chevronDivider = (
    <ChevronDivider
      offset={offset}
      hasMore={hasMore}
      retreat={retreat}
      advance={advance}
      isLight={isLight}
    />
  );

  return (
    <div
      className={cn(
        compact
          ? "mt-0.5 space-y-0.5"
          : transparent
            ? "mt-2.5 space-y-1.5"
            : "mt-1 space-y-1.5",
      )}
    >
      {parsed.summary ? (
        transparent || compact ? (
          <p className="text-[13px] font-bold leading-snug text-[#FF6B35]">
            {parsed.summary}
          </p>
        ) : (
          <div className="rounded-[4px] bg-[#FF6B35]/10 px-2.5 py-2">
            <p className="text-[12px] font-bold leading-snug text-[#FF6B35]">
              {parsed.summary}
            </p>
          </div>
        )
      ) : null}
      {items.map((row, i) => (
        <Fragment key={i}>
          <div
            className={
              transparent || compact
                ? "px-0 py-0"
                : cn("rounded-[4px] px-2.5 py-2", rowCard)
            }
          >
            <p className={questionCls}>{row.label}</p>
            <p className={answerCls}>{row.answer}</p>
          </div>
          {!compact && i < items.length - 1
            ? i === items.length - 2 && (hasMore || offset > 0)
              ? chevronDivider
              : null
            : null}
        </Fragment>
      ))}
      {!compact && items.length === 1 && (hasMore || offset > 0)
        ? chevronDivider
        : null}
    </div>
  );
}
