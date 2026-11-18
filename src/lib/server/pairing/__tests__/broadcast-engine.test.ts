import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSupabase, type Row, type Tables } from "./fake-db";

let tables: Tables;
let rpcs: Record<string, (a: Row) => unknown>;
vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: () => makeFakeSupabase(tables, rpcs),
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/server/merit/merit-engine", () => ({ orderCandidatesByMerit: async (r: unknown[]) => r }));
vi.mock("@/lib/server/notifications", () => ({ insertNotification: vi.fn(async () => undefined) }));
vi.mock("@/lib/server/callout/acceptance", () => ({ voidCalloutForReroute: vi.fn(async () => undefined) }));

import { insertNotification } from "@/lib/server/notifications";
import {
  advancePairing,
  declineRequest,
  deferRequest,
  openRequest,
  reopenJobToPool,
} from "../pairing-engine";

const T0 = Date.parse("2026-06-01T10:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();
const kmNorth = (km: number) => 6.5 + km / 111;

const job = (over: Row = {}): Row => ({
  id: "job-1", job_version: 3, motorist_id: "cust-1", motorist_name: "Ada", service_type: "mechanic",
  problem_text: "car will not start", description: "car will not start",
  status: "requested", flow_status: "sequential_pairing", pairing_stage: "sequential_pairing",
  repair_pro_id: null, repair_pro_name: null, radius_km: 10, pairing_radius_km: 10,
  pickup_lat: 6.5, pickup_lng: 3.3, created_at: iso(T0), updated_at: iso(T0),
  pairing_deadline: null, queue_position: 0, remaining_candidates: null,
  reservation_status: null, assignment_status: null, idempotency_key: null, chosen_pro_id: null,
  status_history: [{ status: "sequential_pairing", at: iso(T0), by: "motorist" }],
  ...over,
});
const pro = (id: string, km: number, over: Row = {}): Row => ({
  user_id: id, business_name: `Biz ${id}`, primary_service: "mechanic", services: ["mechanic"],
  lat: kmNorth(km), lng: 3.3, location_updated_at: iso(T0), is_online: true, status: "approved",
  service_radius_km: 10, profiles: { email: `${id}@real.example`, full_name: id }, ...over,
});
const jobRow = () => tables.service_requests[0];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  vi.mocked(insertNotification).mockClear();
  rpcs = { claim_broadcast_offer: () => "claimed" };
  tables = {
    service_requests: [job()],
    repair_pro_profiles: [pro("near", 1.5), pro("far", 9)],
    request_pairing_queue: [],
    request_reservations: [],
    profiles: [],
  };
});
afterEach(() => vi.useRealTimers());

describe("open search broadcasts instead of picking one pro", () => {
  it("arms the 144 s window, assigns nobody, and pushes only the nearest tier", async () => {
    const res = await advancePairing("job-1");
    expect(res).toMatchObject({ ok: true, noop: true, currentProId: null });
    expect(jobRow().repair_pro_id).toBeNull();
    expect(jobRow().pairing_stage).toBe("sequential_pairing");
    expect(jobRow().pairing_deadline).toBe(iso(T0 + 144_000));
    expect(vi.mocked(insertNotification).mock.calls.map((c) => c[0].userId)).toEqual(["near"]);
  });

  it("is idempotent: running it again does not re-push or move the deadline", async () => {
    await advancePairing("job-1");
    await advancePairing("job-1");
    expect(vi.mocked(insertNotification)).toHaveBeenCalledTimes(1);
    expect(jobRow().pairing_deadline).toBe(iso(T0 + 144_000));
  });

  it("pushes the next tier when it opens", async () => {
    await advancePairing("job-1");
    vi.setSystemTime(T0 + 20_000);
    await advancePairing("job-1");
    expect(vi.mocked(insertNotification).mock.calls.map((c) => c[0].userId)).toEqual(["near", "far"]);
  });

  it("expires the request when the window ends with no taker", async () => {
    await advancePairing("job-1");
    vi.setSystemTime(T0 + 144_000);
    const res = await advancePairing("job-1");
    expect(res).toMatchObject({ ok: true, expired: true });
    expect(jobRow().status).toBe("expired");
    expect(jobRow().pairing_stage).toBeNull();
  });

  it("fails fast when nobody is online in range, so the customer can Retry", async () => {
    tables.repair_pro_profiles = [pro("away", 1, { is_online: false })];
    const first = await advancePairing("job-1");
    expect(first).toMatchObject({ ok: true, noop: true });
    expect(jobRow().pairing_deadline).toBe(iso(T0 + 4_000));
    vi.setSystemTime(T0 + 5_000);
    expect(await advancePairing("job-1")).toMatchObject({ ok: true, expired: true });
  });

  it("keeps waiting when a pro comes online during the short empty hold", async () => {
    tables.repair_pro_profiles = [];
    await advancePairing("job-1");
    tables.repair_pro_profiles = [pro("late", 1)];
    vi.setSystemTime(T0 + 2_000);
    await advancePairing("job-1");
    expect(jobRow().pairing_deadline).toBe(iso(T0 + 144_000));
    expect(jobRow().status).toBe("requested");
  });

  it("does not fail fast when the only pro in range has the app closed but can be pushed", async () => {
    tables.repair_pro_profiles = [pro("away", 1, { location_updated_at: iso(T0 - 60 * 60_000) })];
    tables.push_subscriptions = [{ user_id: "away", endpoint: "e" }];
    await advancePairing("job-1");
    expect(jobRow().pairing_deadline).toBe(iso(T0 + 144_000));
    expect(vi.mocked(insertNotification).mock.calls.map((c) => c[0].userId)).toEqual(["away"]);
  });

  it("leaves a job that was claimed in the meantime alone", async () => {
    Object.assign(jobRow(), { repair_pro_id: "near", pairing_stage: "reserved" });
    const res = await advancePairing("job-1");
    expect(res).toMatchObject({ ok: true, noop: true });
    expect(jobRow().repair_pro_id).toBe("near");
    expect(vi.mocked(insertNotification)).not.toHaveBeenCalled();
  });

  it("does not broadcast in sequential rollback mode", async () => {
    vi.stubEnv("PAIRING_DISPATCH_MODE", "sequential");
    tables.request_pairing_queue = [];
    rpcs.dispatch_pairing_offer = () => "dispatched";
    await advancePairing("job-1");
    expect(tables.request_pairing_queue.every((q) => q.source !== "broadcast")).toBe(true);
    vi.unstubAllEnvs();
  });
});

describe("Open / Decline / Later on an unclaimed job", () => {
  it("Open is the claim: a pro in range takes the job", async () => {
    const calls: unknown[] = [];
    rpcs.claim_broadcast_offer = (a) => (calls.push(a), "claimed");
    expect(await openRequest("job-1", "near")).toMatchObject({ ok: true, currentProId: "near" });
    expect(calls).toHaveLength(1);
  });

  it("Open from a pro whose tier is not open yet is refused", async () => {
    expect(await openRequest("job-1", "far")).toMatchObject({ ok: false, status: 403 });
  });

  it("the second pro to tap Open is told it was taken", async () => {
    rpcs.claim_broadcast_offer = () => "taken";
    expect(await openRequest("job-1", "near")).toMatchObject({ ok: false, status: 409 });
  });

  it("Decline hides the job from that pro only and leaves it open for everyone else", async () => {
    expect(await declineRequest("job-1", "near", "busy")).toMatchObject({ ok: true });
    expect(tables.request_pairing_queue).toEqual([
      expect.objectContaining({ pro_id: "near", status: "declined" }),
    ]);
    expect(jobRow().pairing_stage).toBe("sequential_pairing");
    expect(jobRow().repair_pro_id).toBeNull();
  });

  it("Later is recorded as a 5 minute deferral", async () => {
    expect(await deferRequest("job-1", "near")).toMatchObject({ ok: true });
    expect(tables.request_pairing_queue[0]).toMatchObject({ pro_id: "near", status: "deferred" });
  });

  it("a pro who cannot see the job cannot pollute its queue by declining", async () => {
    expect(await declineRequest("job-1", "far")).toMatchObject({ ok: false, status: 403 });
    expect(tables.request_pairing_queue).toHaveLength(0);
  });
});

describe("rejecting the pro re-opens the job to everyone else", () => {
  beforeEach(() => {
    Object.assign(jobRow(), {
      flow_status: "negotiating", pairing_stage: null, repair_pro_id: "near", repair_pro_name: "Near",
      assignment_status: "assigned", reservation_status: "confirmed", pairing_deadline: null,
      offers: [{ by: "pro", amount: 5000 }], pro_base_major: 5000, agreed_major: null,
    });
    tables.request_reservations = [{ request_id: "job-1", pro_id: "near", status: "confirmed" }];
    tables.request_pairing_queue = [{ request_id: "job-1", pro_id: "near", status: "accepted", position: 1 }];
  });

  it("clears the assignment and the negotiation, and puts it back in the pool", async () => {
    const res = await reopenJobToPool("job-1", { by: "customer", note: "too expensive" });
    expect(res).toMatchObject({ ok: true });
    expect(jobRow()).toMatchObject({
      repair_pro_id: null, repair_pro_name: null, pairing_stage: "sequential_pairing",
      flow_status: "sequential_pairing", status: "requested", assignment_status: "none",
      reservation_status: "none", offers: [], pro_base_major: null, agreed_major: null,
    });
    expect(jobRow().pairing_deadline).toBe(iso(T0 + 144_000));
  });

  it("excludes the rejected pro and releases their reservation", async () => {
    await reopenJobToPool("job-1", { by: "customer" });
    expect(tables.request_pairing_queue.find((q) => q.pro_id === "near")?.status).toBe("declined");
    expect(tables.request_reservations[0].status).toBe("cancelled");
    const history = jobRow().status_history as Array<{ by: string }>;
    expect(history.some((h) => h.by === "rejected:near")).toBe(true);
  });

  it("restarts the nearest-first tiers: the rejected pro is never re-notified", async () => {
    await reopenJobToPool("job-1", { by: "customer" });
    // "near" gets the quiet 'moved on' notice, but no new request push
    const requests = vi.mocked(insertNotification).mock.calls.filter((c) => c[0].title === "Service Request");
    expect(requests.map((c) => c[0].userId)).not.toContain("near");
  });

  it("a pro-initiated back-out reopens it too, without telling that pro", async () => {
    await reopenJobToPool("job-1", { by: "pro", note: "cannot make it" });
    expect(jobRow().repair_pro_id).toBeNull();
    expect(vi.mocked(insertNotification).mock.calls.filter((c) => c[0].userId === "near")).toHaveLength(0);
  });

  it("is idempotent once reopened", async () => {
    await reopenJobToPool("job-1", { by: "customer" });
    expect(await reopenJobToPool("job-1", { by: "customer" })).toMatchObject({ ok: true, noop: true });
  });

  it("refuses to reopen a cancelled job or one already past negotiation", async () => {
    jobRow().status = "cancelled";
    expect(await reopenJobToPool("job-1", { by: "customer" })).toMatchObject({ ok: false, status: 409 });
    Object.assign(jobRow(), { status: "requested", flow_status: "paid_booked" });
    expect(await reopenJobToPool("job-1", { by: "customer" })).toMatchObject({ ok: false, status: 409 });
  });
});
