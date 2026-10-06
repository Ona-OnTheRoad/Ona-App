/** Max concurrent request cards in the lower panel (no scroll for this many). */
export const MAX_VISIBLE_INCOMING = 2;

/** Fast status-check cadence while a request card is on screen the close
 * falls back from realtime to this poll, so a customer cancel lands in ≤ ~½s
 * even when the realtime push is missed on a flaky connection. */
export const INCOMING_POPUP_STATUS_POLL_MS = 500;

export const PEEK_RATIO = 0.05;
export const COLLAPSE_SNAP_PX = 64;
export const FULL_HEIGHT = "min(77%, 760px)";
export const MIDDLE_MAX_H = "max-h-[min(84dvh,760px)]";
/** Same spring as the customer Home lower panel (bottom-sheet.tsx). */
export const SPRING = "0.48s cubic-bezier(0.32, 0.72, 0, 1)";
