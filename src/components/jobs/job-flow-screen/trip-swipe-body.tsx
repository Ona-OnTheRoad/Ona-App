import type {
  MutableRefObject,
  ReactElement,
  ReactNode,
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { LiveJobTrackMap } from "@/components/jobs/live-job-track-map";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  muted: string;
  tripSheetExpanded: boolean;
  setTripSheetExpanded: (v: boolean | ((prev: boolean) => boolean)) => void;
  gestureYRef: MutableRefObject<number | null>;
  metaHeader: ReactNode;
  details: ReactNode;
  callMessageRow: ReactNode;
}

/**
 * Arrived / Work in progress: map + swipeable lower panel (home-style sheet).
 * The map collapses when the sheet expands.
 */
export function TripSwipeBody({
  job,
  viewer,
  isLight,
  muted,
  tripSheetExpanded,
  setTripSheetExpanded,
  gestureYRef,
  metaHeader,
  details,
  callMessageRow,
}: Props): ReactElement {
  const onPillTouchStart = (e: ReactTouchEvent) => {
    gestureYRef.current = e.touches[0].clientY;
  };
  const onPillTouchMove = (e: ReactTouchEvent) => {
    if (gestureYRef.current == null) return;
    const dy = e.touches[0].clientY - gestureYRef.current;
    if (!tripSheetExpanded && dy < -14) {
      setTripSheetExpanded(true);
      gestureYRef.current = null;
      return;
    }
    if (tripSheetExpanded && dy > 14) {
      setTripSheetExpanded(false);
      gestureYRef.current = null;
    }
  };
  const onPillClick = () => setTripSheetExpanded((v) => !v);
  const onSheetWheel = (e: ReactWheelEvent) => {
    if (e.deltaY > 0 && !tripSheetExpanded) {
      e.preventDefault();
      setTripSheetExpanded(true);
      return;
    }
    if (e.deltaY < 0 && tripSheetExpanded) {
      e.preventDefault();
      setTripSheetExpanded(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Map collapses when sheet expands (home pattern) */}
      <div
        className={cn(
          "om-sheet-spring relative min-h-0 overflow-hidden",
          tripSheetExpanded
            ? "h-0 flex-[0_0_0%] opacity-0 pointer-events-none"
            : "flex-[0_0_42%] opacity-100",
        )}
      >
        <div className="absolute inset-0">
          <LiveJobTrackMap job={job} isLight={isLight} viewer={viewer} />
        </div>
      </div>

      {/* Lower swipe sheet */}
      <div
        className={cn(
          "om-sheet-spring z-30 flex min-h-0 flex-col overflow-hidden",
          tripSheetExpanded ? "flex-1" : "flex-[0_0_58%]",
          isLight ? "bg-[#c8c9cd]" : "bg-black",
          !tripSheetExpanded &&
            "rounded-t-[1.5rem] shadow-[0_-6px_24px_rgba(0,0,0,0.18)]",
        )}
        style={{ touchAction: "pan-y" }}
        onWheel={onSheetWheel}
      >
        {/* Expand pill */}
        <div className="shrink-0">
          <div
            role="button"
            tabIndex={0}
            aria-label={
              tripSheetExpanded
                ? "Swipe down to show map"
                : "Swipe up to expand details"
            }
            onClick={onPillClick}
            onTouchStart={onPillTouchStart}
            onTouchMove={onPillTouchMove}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPillClick();
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setTripSheetExpanded(true);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setTripSheetExpanded(false);
              }
            }}
            className="flex cursor-grab justify-center pb-1.5 pt-2.5 active:cursor-grabbing"
            style={{ touchAction: "pan-y" }}
          >
            <span
              className={cn(
                "h-1.5 w-11 rounded-full border-0",
                isLight ? "bg-[#6b7280]" : "bg-white/40",
              )}
            />
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pb-3 scrollbar-hide",
            isLight ? "bg-[#c8c9cd]" : "bg-black",
          )}
        >
          {/* Meta (OnTheRoad · skill · name · ₦) lives only in this solid sheet */}
          <div className="space-y-3 pt-0.5">
            {metaHeader}
            {details}
          </div>
          {/* Push Call / Message / swipe hint lower on the sheet */}
          <div className="mt-auto space-y-2 pt-10">
            {callMessageRow}
            {!tripSheetExpanded && (
              <p
                className={cn(
                  "pb-1 pt-2 text-center text-[10px] font-semibold",
                  muted,
                )}
              >
                Swipe up to expand swipe down to collapse
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
