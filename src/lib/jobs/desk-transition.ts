import { apiTransition, getCurrentPosition } from "@/lib/jobs/client";
import type { RequestStatus } from "@/lib/types";

/**
 * Orders desk -> transition API. The desk speaks the legacy RequestStatus;
 * the server owns the real flow (docs: src/lib/jobs/state-machine.ts), so every
 * desk action is translated into a TransitionEvent and accepted by the server
 * before the UI shows it.
 *
 * `accepted` has no entry on purpose: accepting is the SSPE OPEN/CONFIRM flow
 * (incoming popup), not a plain status change.
 */
export type DeskEvent =
  | "START_TRIP"
  | "MARK_ARRIVED"
  | "START_WORK"
  | "MARK_COMPLETED"
  | "CANCEL";

export type DeskRole = "repair_pro" | "motorist";

const DESK_EVENTS: Partial<Record<RequestStatus, DeskEvent>> = {
  en_route: "START_TRIP",
  arrived: "MARK_ARRIVED",
  in_progress: "START_WORK",
  completed: "MARK_COMPLETED",
  cancelled: "CANCEL",
};

/** Events whose server check needs the pro's position (ETA / proximity). */
const GPS_EVENTS: ReadonlySet<DeskEvent> = new Set([
  "START_TRIP",
  "MARK_ARRIVED",
]);

export function deskEventFor(status: RequestStatus): DeskEvent | null {
  return DESK_EVENTS[status] ?? null;
}

/** Real role on this job; the server rejects a claimed role that differs. */
export function deskRoleFor(
  request: { technicianId: string },
  userId: string,
): DeskRole {
  return request.technicianId === userId ? "repair_pro" : "motorist";
}

/**
 * A pro cancelling a request that is still pending is declining it: the server
 * re-routes it to the next pro instead of cancelling the motorist's request.
 */
export function deskCancelReason(
  role: DeskRole,
  from: RequestStatus,
): string | undefined {
  return role === "repair_pro" && from === "pending" ? "pro_declined" : undefined;
}

async function readProFix(): Promise<{ proLat?: number; proLng?: number }> {
  try {
    const pos = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 20_000,
    });
    return { proLat: pos.coords.latitude, proLng: pos.coords.longitude };
  } catch {
    // Never block here: the server enforces proximity and explains a refusal.
    return {};
  }
}

export type DeskTransitionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function advanceDeskRequest(input: {
  jobId: string;
  userId: string;
  role: DeskRole;
  from: RequestStatus;
  to: RequestStatus;
}): Promise<DeskTransitionResult> {
  const event = deskEventFor(input.to);
  if (!event) {
    return { ok: false, message: "That action is not available from Orders." };
  }
  const gps = GPS_EVENTS.has(event) ? await readProFix() : {};
  const res = await apiTransition({
    jobId: input.jobId,
    event,
    actor: input.role,
    actorId: input.userId,
    reason: event === "CANCEL" ? deskCancelReason(input.role, input.from) : undefined,
    ...gps,
  });
  return res.ok
    ? { ok: true }
    : { ok: false, message: res.message || "Could not update this order." };
}
