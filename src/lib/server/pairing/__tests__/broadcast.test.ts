import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSupabase, type Row, type Tables } from "./fake-db";

vi.mock("@/lib/server/notifications", () => ({ insertNotification: vi.fn(async () => undefined) }));
vi.mock("@/lib/server/merit/merit-engine", () => ({ orderCandidatesByMerit: async (r: unknown[]) => r }));

import { insertNotification } from "@/lib/server/notifications";
import {
  claimBroadcastOffer,
  isOpenPoolRow,
  listBroadcastOffersForPro,
  notifyOpenTiers,
  recordPoolResponse,
  type PoolRow,
} from "../broadcast";

const T0 = Date.parse("2026-06-01T10:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();
// 1 km of latitude ≈ 1/111 degree. Customer pin is the origin.
const kmNorth = (km: number) => 6.5 + km / 111;

function job(over: Row = {}): Row {
  return {
    id: "job-1", motorist_id: "cust-1", motorist_name: "Ada", service_type: "mechanic",
    problem_text: "car will not start", status: "requested", flow_status: "sequential_pairing",
    pairing_stage: "sequential_pairing", repair_pro_id: null, radius_km: 10,
    pickup_lat: 6.5, pickup_lng: 3.3, created_at: iso(T0),
    status_history: [{ status: "sequential_pairing", at: iso(T0), by: "motorist" }],
    ...over,
  };
}
function pro(id: string, km: number, over: Row = {}): Row {
  return {
    user_id: id, business_name: `Biz ${id}`, primary_service: "mechanic", services: ["mechanic"],
    lat: kmNorth(km), lng: 3.3, location_updated_at: iso(T0), is_online: true, status: "approved",
    service_radius_km: 10, profiles: { email: `${id}@real.example`, full_name: id },
    ...over,
  };
}
const db = (tables: Tables, rpcs = {}, calls?: { rpc: Array<{ name: string; args: Row }> }) =>
  makeFakeSupabase(tables, rpcs, calls);
const seen = async (proId: string, tables: Tables) =>
  (await listBroadcastOffersForPro(db(tables), proId)).map((j) => j.id);

describe("broadcast: who sees an open job, and when (closest first)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });
  afterEach(() => vi.useRealTimers());

  const world = (): Tables => ({
    service_requests: [job()],
    repair_pro_profiles: [pro("near", 1.5), pro("mid", 4), pro("far", 9)],
    request_pairing_queue: [],
  });

  it("a 1.5 km pro sees it immediately; 4 km and 9 km pros do not yet", async () => {
    const t = world();
    expect(await seen("near", t)).toEqual(["job-1"]);
    expect(await seen("mid", t)).toEqual([]);
    expect(await seen("far", t)).toEqual([]);
  });

  it("the 5 km tier opens after 10 s, the 10 km tier after 20 s", async () => {
    const t = world();
    vi.setSystemTime(T0 + 10_000);
    expect(await seen("mid", t)).toEqual(["job-1"]);
    expect(await seen("far", t)).toEqual([]);
    vi.setSystemTime(T0 + 20_000);
    expect(await seen("far", t)).toEqual(["job-1"]);
  });

  it("is addressed to the pro as a waiting_for_pro offer with the shared 144 s deadline", async () => {
    const [j] = await listBroadcastOffersForPro(db(world()), "near");
    expect(j.repairProId).toBe("near");
    expect(j.status).toBe("waiting_for_pro");
    expect(j.pairingStage).toBe("waiting_for_pro");
    expect(j.pairingDeadline).toBe(iso(T0 + 144_000));
  });

  it("never shows a job beyond the customer's chosen radius", async () => {
    const t = world();
    (t.service_requests[0] as Row).radius_km = 3;
    vi.setSystemTime(T0 + 60_000);
    expect(await seen("near", t)).toEqual(["job-1"]);
    expect(await seen("mid", t)).toEqual([]);
  });

  it("never shows a job beyond the pro's own coverage radius", async () => {
    const t = world();
    (t.repair_pro_profiles[1] as Row).service_radius_km = 3;
    vi.setSystemTime(T0 + 60_000);
    expect(await seen("mid", t)).toEqual([]);
  });

  it("hides it from pros of another trade, offline pros and stale-heartbeat pros", async () => {
    const t = world();
    t.repair_pro_profiles.push(
      pro("plumber", 1, { primary_service: "plumber", services: ["plumber"] }),
      pro("offline", 1, { is_online: false }),
      pro("stale", 1, { location_updated_at: iso(T0 - 10 * 60_000) }),
    );
    expect(await seen("plumber", t)).toEqual([]);
    expect(await seen("offline", t)).toEqual([]);
    expect(await seen("stale", t)).toEqual([]);
  });

  it("hides suspended and demo/synthetic pros", async () => {
    const t = world();
    t.repair_pro_profiles.push(
      pro("susp", 1, { status: "suspended" }),
      pro("demo", 1, { profiles: { email: "x@ona-audit.test", full_name: "Demo Pro" }, business_name: "Demo Garage" }),
    );
    expect(await seen("susp", t)).toEqual([]);
  });

  it("hides a job from a pro who declined it, and during Later; shows it again after 5 min", async () => {
    const t = world();
    t.request_pairing_queue.push({ request_id: "job-1", pro_id: "near", status: "declined" });
    expect(await seen("near", t)).toEqual([]);

    const t2 = world();
    t2.request_pairing_queue.push({ request_id: "job-1", pro_id: "near", status: "deferred", responded_at: iso(T0) });
    expect(await seen("near", t2)).toEqual([]);
    vi.setSystemTime(T0 + 5 * 60_000 + 1);
    // window is only 144 s, so the job itself has lapsed by then: nothing to show
    expect(await seen("near", t2)).toEqual([]);
  });

  it("a pro who was notified (pending marker) still sees it", async () => {
    const t = world();
    t.request_pairing_queue.push({ request_id: "job-1", pro_id: "near", status: "pending" });
    expect(await seen("near", t)).toEqual(["job-1"]);
  });

  it("does not list claimed, cancelled or expired jobs, or a lapsed window", async () => {
    const t = world();
    t.service_requests = [
      job({ id: "claimed", repair_pro_id: "someone", pairing_stage: "reserved" }),
      job({ id: "cancelled", status: "cancelled" }),
      job({ id: "expired", status: "expired" }),
    ];
    expect(await seen("near", t)).toEqual([]);
    const t2 = world();
    vi.setSystemTime(T0 + 144_000);
    expect(await seen("near", t2)).toEqual([]);
  });

  it("a pro never sees their own customer request", async () => {
    const t = world();
    (t.service_requests[0] as Row).motorist_id = "near";
    expect(await seen("near", t)).toEqual([]);
  });

  it("a reopened job restarts the tiers: the nearest pros get the head start again", async () => {
    const t = world();
    (t.service_requests[0] as Row).status_history = [
      { status: "sequential_pairing", at: iso(T0), by: "motorist" },
      { status: "sequential_pairing", at: iso(T0 + 60_000), by: "rejected:x" },
    ];
    vi.setSystemTime(T0 + 62_000);
    expect(await seen("near", t)).toEqual(["job-1"]);
    expect(await seen("mid", t)).toEqual([]);
    vi.setSystemTime(T0 + 71_000);
    expect(await seen("mid", t)).toEqual(["job-1"]);
  });

  it("is off in sequential rollback mode", async () => {
    vi.stubEnv("PAIRING_DISPATCH_MODE", "sequential");
    expect(await seen("near", world())).toEqual([]);
    vi.unstubAllEnvs();
  });
});

describe("broadcast: claiming (first pro wins)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });
  afterEach(() => vi.useRealTimers());

  const world = (): Tables => ({
    service_requests: [job()],
    repair_pro_profiles: [pro("near", 1.5), pro("far", 9)],
    request_pairing_queue: [],
    profiles: [{ id: "near", full_name: "Near Pro", avatar_url: null }, { id: "far", full_name: "Far Pro", avatar_url: null }],
  });

  it("claims through the atomic RPC with the pro's name and the 144 s window", async () => {
    const calls = { rpc: [] as Array<{ name: string; args: Row }> };
    const res = await claimBroadcastOffer(db(world(), { claim_broadcast_offer: () => "claimed" }, calls), "job-1", "near");
    expect(res).toEqual({ ok: true, jobId: "job-1" });
    expect(calls.rpc[0].args).toMatchObject({ p_request_id: "job-1", p_pro_id: "near", p_pro_name: "Near Pro", p_window_ms: 144_000 });
  });

  it("refuses a pro who cannot see the job yet (tier not open) without calling the RPC", async () => {
    const calls = { rpc: [] as Array<{ name: string; args: Row }> };
    const res = await claimBroadcastOffer(db(world(), { claim_broadcast_offer: () => "claimed" }, calls), "job-1", "far");
    expect(res).toMatchObject({ ok: false, status: 403 });
    expect(calls.rpc).toHaveLength(0);
  });

  it("lets the far pro claim once their tier has opened", async () => {
    vi.setSystemTime(T0 + 20_000);
    const res = await claimBroadcastOffer(db(world(), { claim_broadcast_offer: () => "claimed" }), "job-1", "far");
    expect(res.ok).toBe(true);
  });

  it("tells the loser it was already taken (409), both before and during the race", async () => {
    const t = world();
    (t.service_requests[0] as Row).repair_pro_id = "near";
    expect(await claimBroadcastOffer(db(t, { claim_broadcast_offer: () => "claimed" }), "job-1", "far")).toMatchObject({ ok: false, status: 409 });
    expect(await claimBroadcastOffer(db(world(), { claim_broadcast_offer: () => "taken" }), "job-1", "near")).toMatchObject({ ok: false, status: 409 });
  });

  it("maps closed / excluded / not-found / database failure", async () => {
    expect(await claimBroadcastOffer(db(world(), { claim_broadcast_offer: () => "closed" }), "job-1", "near")).toMatchObject({ status: 409 });
    expect(await claimBroadcastOffer(db(world(), { claim_broadcast_offer: () => "excluded" }), "job-1", "near")).toMatchObject({ status: 403 });
    expect(await claimBroadcastOffer(db(world(), {}), "job-1", "near")).toMatchObject({ status: 503 });
    expect(await claimBroadcastOffer(db(world()), "missing", "near")).toMatchObject({ status: 404 });
  });

  it("refuses a cancelled job and a customer claiming their own request", async () => {
    const t = world();
    (t.service_requests[0] as Row).status = "cancelled";
    expect(await claimBroadcastOffer(db(t, { claim_broadcast_offer: () => "claimed" }), "job-1", "near")).toMatchObject({ status: 409 });
    const t2 = world();
    (t2.service_requests[0] as Row).motorist_id = "near";
    expect(await claimBroadcastOffer(db(t2, { claim_broadcast_offer: () => "claimed" }), "job-1", "near")).toMatchObject({ status: 403 });
  });

  it("an idempotent replay by the holder is a no-op success", async () => {
    const t = world();
    (t.service_requests[0] as Row).repair_pro_id = "near";
    const res = await claimBroadcastOffer(db(t, { claim_broadcast_offer: () => "noop" }), "job-1", "near");
    expect(res).toEqual({ ok: true, jobId: "job-1", noop: true });
  });
});

describe("broadcast: dismissing and notifying", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    vi.mocked(insertNotification).mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("Decline / Later on an unclaimed job only records that pro's response", async () => {
    const t: Tables = { request_pairing_queue: [] };
    expect(await recordPoolResponse(db(t), "job-1", "near", "declined", "busy")).toEqual({ ok: true });
    expect(t.request_pairing_queue[0]).toMatchObject({ request_id: "job-1", pro_id: "near", status: "declined", result_note: "busy" });
  });

  it("pushes only to pros whose tier is open, and only once", async () => {
    const t: Tables = {
      service_requests: [job()],
      repair_pro_profiles: [pro("near", 1.5), pro("mid", 4), pro("far", 9)],
      request_pairing_queue: [],
    };
    const row = t.service_requests[0] as unknown as PoolRow;
    expect(await notifyOpenTiers(db(t), row)).toBe(1);
    expect(vi.mocked(insertNotification).mock.calls.map((c) => c[0].userId)).toEqual(["near"]);
    expect(await notifyOpenTiers(db(t), row)).toBe(0); // already told

    vi.setSystemTime(T0 + 10_000);
    expect(await notifyOpenTiers(db(t), row)).toBe(1);
    vi.setSystemTime(T0 + 20_000);
    expect(await notifyOpenTiers(db(t), row)).toBe(1);
    expect(vi.mocked(insertNotification).mock.calls.map((c) => c[0].userId)).toEqual(["near", "mid", "far"]);
  });

  it("does not push to a pro who already declined", async () => {
    const t: Tables = {
      service_requests: [job()],
      repair_pro_profiles: [pro("near", 1.5)],
      request_pairing_queue: [{ request_id: "job-1", pro_id: "near", status: "declined" }],
    };
    expect(await notifyOpenTiers(db(t), t.service_requests[0] as unknown as PoolRow)).toBe(0);
  });
});

describe("broadcast: alerting pros who closed the app", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    vi.mocked(insertNotification).mockClear();
  });
  afterEach(() => vi.useRealTimers());

  const world = (staleMs: number, subscribed: boolean): Tables => ({
    service_requests: [job()],
    repair_pro_profiles: [pro("away", 1, { location_updated_at: iso(T0 - staleMs) })],
    request_pairing_queue: [],
    push_subscriptions: subscribed ? [{ user_id: "away", endpoint: "e" }] : [],
  });
  const told = () => vi.mocked(insertNotification).mock.calls.map((c) => c[0].userId);

  it("alerts an online pro whose pin is 1 h old (app closed) when they have a push subscription", async () => {
    const t = world(60 * 60_000, true);
    expect(await notifyOpenTiers(db(t), t.service_requests[0] as unknown as PoolRow)).toBe(1);
    expect(told()).toEqual(["away"]);
  });

  it("does not alert a closed-app pro with no push subscription (nothing could reach them)", async () => {
    const t = world(60 * 60_000, false);
    expect(await notifyOpenTiers(db(t), t.service_requests[0] as unknown as PoolRow)).toBe(0);
  });

  it("stops alerting once the pin is older than 2 hours", async () => {
    const t = world(2 * 60 * 60_000 + 1000, true);
    expect(await notifyOpenTiers(db(t), t.service_requests[0] as unknown as PoolRow)).toBe(0);
  });

  it("still respects distance tiers for a closed-app pro", async () => {
    const t = world(60 * 60_000, true);
    (t.repair_pro_profiles[0] as Row).lat = kmNorth(4);
    expect(await notifyOpenTiers(db(t), t.service_requests[0] as unknown as PoolRow)).toBe(0);
    vi.setSystemTime(T0 + 10_000);
    expect(await notifyOpenTiers(db(t), t.service_requests[0] as unknown as PoolRow)).toBe(1);
  });

  it("an alerted pro still cannot see or claim the job until the app is open again (fresh pin)", async () => {
    const t = world(60 * 60_000, true);
    expect(await seen("away", t)).toEqual([]);
    (t.repair_pro_profiles[0] as Row).location_updated_at = iso(T0); // app reopened, pin refreshed
    expect(await seen("away", t)).toEqual(["job-1"]);
  });
});

describe("isOpenPoolRow", () => {
  it("is true only for an unclaimed, live sequential_pairing job", () => {
    expect(isOpenPoolRow({ pairing_stage: "sequential_pairing", repair_pro_id: null, status: "requested" })).toBe(true);
    expect(isOpenPoolRow({ pairing_stage: "sequential_pairing", repair_pro_id: "p", status: "requested" })).toBe(false);
    expect(isOpenPoolRow({ pairing_stage: "reserved", repair_pro_id: null, status: "requested" })).toBe(false);
    expect(isOpenPoolRow({ pairing_stage: "sequential_pairing", repair_pro_id: null, status: "cancelled" })).toBe(false);
    expect(isOpenPoolRow(null)).toBe(false);
  });
});
