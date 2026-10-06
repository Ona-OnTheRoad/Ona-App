import type { JobFlowStatus } from "@/lib/jobs/types";
import { isProService, PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import type { ProService } from "@/lib/types";

/** Service Request only leaves dashboard after Accept */
export const INCOMING_STATUSES = new Set<JobFlowStatus>([
  "waiting_for_selected",
  "selected_review",
  "waiting_for_pro",
  "reserved",
  "negotiating",
]);

/** Active work the pro can open quickly (agreed → in progress → awaiting customer) */
export const ONGOING_STATUSES = new Set<JobFlowStatus>([
  "agreed",
  "paid_booked",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
]);

/** Past / closed jobs for Recent same set for every trade (Battery, Vulcanizer, …) */
export const RECENT_STATUSES = new Set<JobFlowStatus>([
  "satisfied",
  "released",
]);

export function ongoingStatusLabel(st: JobFlowStatus): string {
  switch (st) {
    case "agreed":
      return "Awaiting payment";
    case "paid_booked":
      return "Booked · start trip";
    case "en_route":
      return "En route";
    case "arrived":
      return "Arrived";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Awaiting customer confirm";
    default:
      return st;
  }
}

/** Common city / area tokens for subtitle line */
export const AREA_HINT =
  /\b(lekki|ikeja|ikoyi|vi|victoria island|island|ajah|yaba|surulere|gbagada|magodo|maryland|ojodu|berger|festac|apapa|mainland|abuja|lagos|phase\s*\d*|estate|gate|route|alternative)\b/i;

/** Away CTA when already Live rotates every 3 hours */
export const LIVE_AWAY_LABELS = [
  "Take Time Off",
  "Take Some Rest",
  "Go Away",
] as const;
export const LIVE_AWAY_ROTATE_MS = 3 * 60 * 60 * 1000;

export function liveAwayButtonLabel(now = Date.now()): string {
  const i = Math.floor(now / LIVE_AWAY_ROTATE_MS) % LIVE_AWAY_LABELS.length;
  return LIVE_AWAY_LABELS[i];
}

/**
 * Uber-style split from full Google address:
 * title = street / first segment
 * subtitle = everything under (area, city, …)
 * Always try to produce a second line when the full address has commas.
 */
export function splitPlaceAndArea(label: string): {
  title: string;
  subtitle: string | null;
} {
  const raw = label.trim();
  if (!raw) return { title: "", subtitle: null };
  // "7b Oye Balogun Street, Lekki, Lagos, Nigeria"
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      title: parts[0],
      subtitle: parts.slice(1).join(", "),
    };
  }
  // Single phrase: try trailing area keyword
  const words = raw.split(/\s+/);
  if (words.length >= 2) {
    for (let i = words.length - 1; i >= 1; i--) {
      const tail = words.slice(i).join(" ");
      if (AREA_HINT.test(tail)) {
        return {
          title: words.slice(0, i).join(" "),
          subtitle: tail,
        };
      }
    }
  }
  return { title: raw, subtitle: null };
}

/** e.g. Mechanic → "Mechanic Dashboard"; unknown → "Repair Pro Dashboard" */
export function skillDashboardTitle(
  skill: ProService | string | null | undefined,
): string {
  const raw = String(skill || "")
    .trim()
    .toLowerCase();
  if (raw && isProService(raw)) {
    return `${PRO_SERVICE_LABELS[raw]} Dashboard`;
  }
  // Specialty-only strings sometimes stored without catalog id
  if (raw) {
    const pretty = raw
      .split(/[\s_/|-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    if (pretty) return `${pretty} Dashboard`;
  }
  return "Repair Pro Dashboard";
}
