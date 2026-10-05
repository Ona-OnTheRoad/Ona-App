import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestStatus } from "@/lib/types";

const apiTransition = vi.fn();
const getCurrentPosition = vi.fn();

vi.mock("@/lib/jobs/client", () => ({
  apiTransition: (...a: unknown[]) => apiTransition(...a),
  getCurrentPosition: (...a: unknown[]) => getCurrentPosition(...a),
}));

import {
  advanceDeskRequest,
  deskCancelReason,
  deskEventFor,
  deskRoleFor,
} from "@/lib/jobs/desk-transition";
import { canTransition } from "@/lib/jobs/state-machine";

beforeEach(() => {
  apiTransition.mockReset();
  getCurrentPosition.mockReset();
});

describe("deskEventFor", () => {
  it.each<[RequestStatus, string]>([
    ["en_route", "START_TRIP"],
    ["arrived", "MARK_ARRIVED"],
    ["in_progress", "START_WORK"],
    ["completed", "MARK_COMPLETED"],
    ["cancelled", "CANCEL"],
  ])("maps %s to %s", (status, event) => {
    expect(deskEventFor(status)).toBe(event);
  });

  it("has no plain event for accepted or pending (accept is Open/Confirm)", () => {
    expect(deskEventFor("accepted")).toBeNull();
    expect(deskEventFor("pending")).toBeNull();
  });

  it("only emits events the state machine knows from the matching flow status", () => {
    expect(canTransition("paid_booked", { type: "START_TRIP" })).toBe(true);
    expect(canTransition("en_route", { type: "MARK_ARRIVED" })).toBe(true);
    expect(canTransition("arrived", { type: "START_WORK" })).toBe(true);
    expect(canTransition("in_progress", { type: "MARK_COMPLETED" })).toBe(true);
  });
});

describe("deskRoleFor / deskCancelReason", () => {
  it("uses the real role on the job", () => {
    expect(deskRoleFor({ technicianId: "pro1" }, "pro1")).toBe("repair_pro");
    expect(deskRoleFor({ technicianId: "pro1" }, "mot1")).toBe("motorist");
  });

  it("marks a pro cancelling a pending request as a decline", () => {
    expect(deskCancelReason("repair_pro", "pending")).toBe("pro_declined");
    expect(deskCancelReason("repair_pro", "accepted")).toBeUndefined();
    expect(deskCancelReason("motorist", "pending")).toBeUndefined();
  });
});

describe("advanceDeskRequest", () => {
  const base = {
    jobId: "job1",
    userId: "pro1",
    role: "repair_pro" as const,
    from: "accepted" as RequestStatus,
  };

  it("sends the pro's GPS with MARK_ARRIVED", async () => {
    getCurrentPosition.mockResolvedValue({
      coords: { latitude: 6.5, longitude: 3.4 },
    });
    apiTransition.mockResolvedValue({ ok: true, data: { job: {} } });
    const res = await advanceDeskRequest({ ...base, to: "arrived" });
    expect(res).toEqual({ ok: true });
    expect(apiTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job1",
        event: "MARK_ARRIVED",
        actor: "repair_pro",
        actorId: "pro1",
        proLat: 6.5,
        proLng: 3.4,
      }),
    );
  });

  it("does not ask for GPS on START_WORK", async () => {
    apiTransition.mockResolvedValue({ ok: true, data: { job: {} } });
    await advanceDeskRequest({ ...base, to: "in_progress" });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("still sends the transition when GPS is unavailable", async () => {
    getCurrentPosition.mockRejectedValue(new Error("denied"));
    apiTransition.mockResolvedValue({ ok: true, data: { job: {} } });
    await advanceDeskRequest({ ...base, to: "en_route" });
    const sent = apiTransition.mock.calls[0][0];
    expect(sent.event).toBe("START_TRIP");
    expect(sent.proLat).toBeUndefined();
  });

  it("returns the server's message when the transition is rejected", async () => {
    getCurrentPosition.mockRejectedValue(new Error("denied"));
    apiTransition.mockResolvedValue({ ok: false, message: "Too far from customer" });
    const res = await advanceDeskRequest({ ...base, to: "arrived" });
    expect(res).toEqual({ ok: false, message: "Too far from customer" });
  });

  it("refuses accepted without calling the server", async () => {
    const res = await advanceDeskRequest({ ...base, from: "pending", to: "accepted" });
    expect(res.ok).toBe(false);
    expect(apiTransition).not.toHaveBeenCalled();
  });
});
