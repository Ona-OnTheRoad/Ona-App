import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/server/merit/merit-engine", () => ({ orderCandidatesByMerit: async (rows: unknown[]) => rows }));
import { createServiceSupabase } from "@/lib/supabase/server";
import { advancePairing } from "../pairing-engine";
vi.mock("@/lib/server/notifications", () => ({ insertNotification: vi.fn(async () => { notifications++; }) }));

type Row = Record<string, unknown>;
let row: Row;
let queue: Row[];
let beforeDispatch: (() => void) | undefined;
let rpcError: string | undefined;
let notifications: number;
let rpcCalls: number;

function client() {
  const from = (table: string) => {
    let patch: Row | undefined;
    const guards: Row = {};
    const run = () => {
      if (table === "service_requests") {
        if (patch) {
          if (Object.entries(guards).some(([key, value]) => row[key] !== value)) return { data: null, error: null };
          Object.assign(row, patch);
        }
        return { data: { ...row }, error: null };
      }
      if (table === "request_pairing_queue") return { data: queue.map((q) => ({ ...q })), error: null };
      if (table === "repair_pro_profiles") return { data: [{ user_id: "pro", primary_service: "mechanic", services: ["mechanic"], lat: 6.5, lng: 3.3, location_updated_at: new Date().toISOString() }], error: null };
      if (table === "profiles") return { data: { full_name: "Pro", avatar_url: null }, error: null };
      return { data: null, error: null };
    };
    const q = {
      select: () => q,
      eq: (key: string, value: unknown) => { guards[key] = value; return q; },
      neq: () => q, order: () => q, limit: () => q, in: () => q,
      update: (value: Row) => { patch = value; return q; },
      maybeSingle: async () => run(),
      upsert: async (offer: Row) => { queue.push(offer); beforeDispatch?.(); return { data: null, error: null }; },
      insert: async () => { notifications++; return { data: null, error: null }; },
      then: (resolve: (v: unknown) => void) => Promise.resolve(run()).then(resolve),
    };
    return q;
  };
  return { from, rpc: async (_name: string, args: Row) => {
    rpcCalls++;
    beforeDispatch?.();
    if (rpcError) return { data: null, error: { message: rpcError } };
    if (row.pairing_stage !== "sequential_pairing" || row.repair_pro_id || row.reservation_status === "confirmed" || row.assignment_status === "assigned") return { data: "noop", error: null };
    if (row.job_version !== args.p_expected_version) return { data: "conflict", error: null };
    queue.push({ pro_id: args.p_pro_id, status: "offered" });
    Object.assign(row, { job_version: Number(row.job_version) + 1, pairing_stage: "waiting_for_pro", flow_status: "waiting_for_pro", repair_pro_id: args.p_pro_id, queue_position: Number(row.queue_position) + 1 });
    return { data: "dispatched", error: null };
  } };
}

beforeEach(() => {
  row = { id: "job", job_version: 0, motorist_id: "customer", motorist_name: "Customer", service_type: "mechanic", description: "Engine fault", pickup_lat: 6.5, pickup_lng: 3.3, pairing_stage: "sequential_pairing", flow_status: "sequential_pairing", status: "requested", repair_pro_id: null, pairing_radius_km: 5, radius_km: 5, queue_position: 0, reservation_status: "none", assignment_status: "none", status_history: [], updated_at: new Date().toISOString() };
  queue = []; beforeDispatch = undefined; rpcError = undefined; notifications = 0; rpcCalls = 0;
  vi.mocked(createServiceSupabase).mockReturnValue(client() as never);
});

it("recovers when classification increments the version before dispatch, without orphaning the pro offer", async () => {
  beforeDispatch = () => { row.job_version = Number(row.job_version) + 1; row.likely_trade_ids = ["mechanic"]; beforeDispatch = undefined; };
  expect(await advancePairing("job")).toMatchObject({ ok: true, currentProId: "pro" });
  expect(row.repair_pro_id).toBe("pro");
  expect(row.likely_trade_ids).toEqual(["mechanic"]);
  expect(queue).toHaveLength(1);
  expect(rpcCalls).toBe(2);
  expect(notifications).toBe(1);
});

it.each(["cancelled", "negotiating"])("preserves a concurrent %s winner without creating an offer", async (state) => {
  beforeDispatch = () => { row.job_version = Number(row.job_version) + 1; row.pairing_stage = null; row.flow_status = state; row.status = state; beforeDispatch = undefined; };
  expect(await advancePairing("job")).toMatchObject({ ok: true, noop: true });
  expect(queue).toHaveLength(0);
  expect(row.flow_status).toBe(state);
  expect(notifications).toBe(0);
});

it("reports sustained contention rather than falsely succeeding", async () => {
  beforeDispatch = () => { row.job_version = Number(row.job_version) + 1; };
  expect(await advancePairing("job")).toMatchObject({ ok: false, status: 409 });
  expect(rpcCalls).toBe(3);
  expect(queue).toHaveLength(0);
  expect(notifications).toBe(0);
});

it("fails closed when the atomic dispatch RPC is unavailable", async () => {
  rpcError = "function not found";
  expect(await advancePairing("job")).toMatchObject({ ok: false, status: 503 });
  expect(rpcCalls).toBe(1);
  expect(queue).toHaveLength(0);
  expect(notifications).toBe(0);
});

it("reselects candidates against updated classification instead of assigning the stale trade", async () => {
  beforeDispatch = () => { row.job_version = 1; row.likely_trade_ids = ["electrical"]; beforeDispatch = undefined; };
  const result = await advancePairing("job");
  expect(result).toMatchObject({ ok: true });
  expect(row.repair_pro_id).toBeNull();
  expect(queue).toHaveLength(0);
  expect(rpcCalls).toBe(1);
  expect(notifications).toBe(0);
});

it("does not advance an existing pro assignment", async () => {
  row.repair_pro_id = "other-pro";
  row.pairing_stage = "waiting_for_pro";
  expect(await advancePairing("job")).toMatchObject({ ok: true, noop: true });
  expect(row.repair_pro_id).toBe("other-pro");
  expect(rpcCalls).toBe(0);
  expect(queue).toHaveLength(0);
});
