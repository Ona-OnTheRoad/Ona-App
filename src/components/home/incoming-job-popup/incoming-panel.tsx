import { ChevronUp } from "lucide-react";
import { INCOMING_POPUP_VISIBLE_SEC } from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { FULL_HEIGHT, MIDDLE_MAX_H, SPRING } from "./constants";
import { jobTitle } from "./helpers";
import { IncomingCard } from "./incoming-card";
import type { LightboxState, PanelLevel } from "./types";
import type { IncomingPanelGesture } from "./use-incoming-panel";

interface IncomingPanelProps {
  gesture: IncomingPanelGesture;
  level: PanelLevel;
  onExpandFromCollapsed: () => void;
  visibleJobs: JobRecord[];
  timeLeftById: Record<string, number>;
  acceptingId: string | null;
  backendUserId: string | null | undefined;
  actionError: string | null;
  isLight: boolean;
  solid: string;
  ink: string;
  muted: string;
  hairline: string;
  onOpenPhotos: (lb: LightboxState) => void;
  onDecline: (job: JobRecord) => void;
  onConfirm: (job: JobRecord) => void;
}

/** Lower panel medium compact, up to 2 cards; buttons stay full-size. */
export function IncomingPanel({
  gesture,
  level,
  onExpandFromCollapsed,
  visibleJobs,
  timeLeftById,
  acceptingId,
  backendUserId,
  actionError,
  isLight,
  solid,
  ink,
  muted,
  hairline,
  onOpenPhotos,
  onDecline,
  onConfirm,
}: IncomingPanelProps) {
  const {
    dragY,
    dragging,
    dialogRef,
    panelHeightRef,
    panelScrollRef,
    peekHeight,
    stepDown,
    onPanelPointerDown,
    onPanelPointerMove,
    onPanelPointerEnd,
  } = gesture;
  return (
    <div
      ref={(el) => {
        dialogRef.current = el;
        if (
          el &&
          level !== "collapsed" &&
          el.clientHeight > panelHeightRef.current
        ) {
          panelHeightRef.current = el.clientHeight;
        }
      }}
      className={cn(
        "pointer-events-auto absolute inset-x-0 bottom-0 z-[180] flex flex-col rounded-t-[1.75rem] shadow-[0_-8px_28px_rgba(0,0,0,0.28)]",
        level === "collapsed"
          ? "cursor-pointer"
          : cn(
              "px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              level === "middle" && MIDDLE_MAX_H,
            ),
      )}
      style={{
        backgroundColor: solid,
        borderTop: `0.5px solid ${hairline}`,
        height:
          level === "collapsed"
            ? peekHeight
            : level === "full"
              ? FULL_HEIGHT
              : undefined,
        transform: dragging ? `translateY(${dragY}px)` : undefined,
        transition: dragging ? "none" : `height ${SPRING}, transform ${SPRING}`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={
        level === "collapsed"
          ? `${visibleJobs.length} incoming ${
              visibleJobs.length === 1 ? "request" : "requests"
            }`
          : visibleJobs.length > 1
            ? `${visibleJobs.length} incoming requests`
            : jobTitle(visibleJobs[0])
      }
      onClick={(e) => {
        e.stopPropagation();
        if (level === "collapsed") onExpandFromCollapsed();
      }}
      onPointerDown={onPanelPointerDown}
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerEnd}
      onPointerCancel={onPanelPointerEnd}
    >
      {level === "collapsed" ? (
        <div className="flex h-full min-h-0 items-center justify-center gap-2 px-3">
          <div
            className={cn(
              "h-1 w-9 shrink-0 rounded-full",
              isLight ? "bg-black/15" : "bg-white/20",
            )}
          />
          <span className="text-[11px] font-bold" style={{ color: muted }}>
            {visibleJobs.length} incoming{" "}
            {visibleJobs.length === 1 ? "request" : "requests"}
          </span>
          <ChevronUp
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: muted }}
          />
        </div>
      ) : (
        <>
          <div className="flex shrink-0 justify-center pb-1.5 pt-1">
            <button
              type="button"
              aria-label={
                level === "full" ? "Show fewer questions" : "Minimize panel"
              }
              className="flex cursor-grab items-center justify-center border-0 bg-transparent px-8 py-0.5 active:cursor-grabbing"
              onClick={stepDown}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span
                className={cn(
                  "block h-[5px] w-10 rounded-full",
                  isLight ? "bg-black/25" : "bg-white/35",
                )}
              />
            </button>
          </div>
          {visibleJobs.length > 1 ? (
            <p
              className="mb-1.5 shrink-0 text-center text-[11px] font-bold"
              style={{ color: muted }}
            >
              {visibleJobs.length} requests · respond to each
            </p>
          ) : null}

          <div
            ref={panelScrollRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain scrollbar-hide"
            data-panel-scroll
          >
            {visibleJobs.map((job) => (
              <IncomingCard
                key={job.id}
                job={job}
                level={level}
                isLight={isLight}
                ink={ink}
                timeLeft={timeLeftById[job.id] ?? INCOMING_POPUP_VISIBLE_SEC}
                acceptingId={acceptingId}
                backendUserId={backendUserId}
                onOpenPhotos={onOpenPhotos}
                onDecline={onDecline}
                onConfirm={onConfirm}
              />
            ))}
          </div>

          {actionError ? (
            <p
              className="mt-2 shrink-0 text-center text-[12px] font-semibold"
              style={{ color: isLight ? "#b91c1c" : "#fca5a5" }}
            >
              {actionError}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
