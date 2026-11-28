import { describe, expect, it } from "vitest";
import {
  DELIVERY_TRANSITIONS,
  isAllowedDeliveryTransition,
} from "@/lib/shop/delivery-transitions";

describe("delivery transitions", () => {
  it("allows same-status edits (courier/notes without moving status)", () => {
    expect(isAllowedDeliveryTransition("assigned", "assigned")).toBe(true);
    expect(isAllowedDeliveryTransition("delivered", "delivered")).toBe(true);
  });

  it("allows forward moves from the matrix and blocks illegal jumps", () => {
    expect(isAllowedDeliveryTransition("pending", "assigned")).toBe(true);
    expect(isAllowedDeliveryTransition("assigned", "in_transit")).toBe(true);
    expect(isAllowedDeliveryTransition("pending", "delivered")).toBe(false);
    expect(isAllowedDeliveryTransition("delivered", "pending")).toBe(false);
  });

  it("keeps terminal statuses closed", () => {
    expect(DELIVERY_TRANSITIONS.delivered).toEqual([]);
    expect(DELIVERY_TRANSITIONS.cancelled).toEqual([]);
  });
});
