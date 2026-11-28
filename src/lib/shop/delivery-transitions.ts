/** Shared (client + server) delivery state machine for the shop. */

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

/** Which statuses a delivery may move to from each status. Same-status edits (courier/notes) are always allowed. */
export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picked_up", "in_transit", "failed", "cancelled"],
  picked_up: ["in_transit", "delivered", "failed"],
  in_transit: ["delivered", "failed"],
  failed: ["pending", "assigned", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function isAllowedDeliveryTransition(
  from: DeliveryStatus,
  to: DeliveryStatus,
): boolean {
  return from === to || DELIVERY_TRANSITIONS[from].includes(to);
}
