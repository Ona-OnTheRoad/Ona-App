import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/jobs/deadlines/sweep-lease", () => ({
  withSweepLease: async (_scope: string, operation: () => Promise<unknown>) => operation(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true,
}));

vi.mock("@/lib/server/merit/merit-engine", () => ({
  orderCandidatesByMerit: vi.fn(
    async (candidates: Array<{ user_id: string }>) => [...candidates],
  ),
  getMeritScoresForPros: vi.fn(async () => new Map<string, number>()),
  recalculateMerit: vi.fn(async () => {}),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  openRequest,
  confirmRequest,
  declineRequest,
  timeoutRequest,
  advancePairing,
  sweepPairing,
  retrySearch,
  MAX_PAIRING_ATTEMPTS,
} from "@/lib/server/pairing/pairing-engine";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

type Row = {
  id: string;
  motorist_id: string;
  motorist_name: string | null;
  repair_pro_id: string | null;
  service_type: string;
  problem_text: string | null;
  description: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pairing_stage: string | null;
  pairing_deadline: string | null;
  pairing_radius_km: number | null;
  radius_km: number | null;
  queue_position: number | null;
  remaining_candidates: number | null;
  reservation_status: string | null;
  assignment_status: string | null;
  idempotency_key: string | null;
  chosen_pro_id: string | null;
  status_history: unknown;
  flow_status: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const FULL_ROW: Row = {
  id: "job-1",
  motorist_id: "motorist-1",
  motorist_name: "Ada",
  repair_pro_id: "pro-1",
  service_type: "auto",
  problem_text: "Tyre burst on Third Mainland Bridge",
  description: null,
  pickup_lat: 6.5,
  pickup_lng: 3.3,
  pairing_stage: "waiting_for_selected",
  pairing_deadline: new Date(Date.now() + 60_000).toISOString(),
  pairing_radius_km: 15,
  radius_km: 10,
  queue_position: 1,
  remaining_candidates: 2,
  reservation_status: "none",
  assignment_status: "none",
  idempotency_key: null,
  chosen_pro_id: "pro-1",
  status_history: [],
  flow_status: "waiting_for_selected",
  status: "requested",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/** Record of (table, op, args) sent through the fake client. */
const sent: { table: string; op: string; args: unknown[] }[] = [];

type Responder =
  | { data?: unknown; error?: { message: string } | null }
  | Promise<{ data?: unknown; error?: { message: string } | null }>;

/** Per-table scripted responders; default = { error: null }. */
const responders: Record<
  string,
  (calls: { op: string; args: unknown[] }[]) => Responder
> = {};

function resolveResponder(
  table: string,
  calls: { op: string; args: unknown[] }[],
): Responder {
  const fn = responders[table];
  return fn ? fn(calls) : { data: null, error: null };
}

function makeQuery(table: string) {
  const calls: { op: string; args: unknown[] }[] = [];
  const record = (op: string, args: unknown[]) => {
    calls.push({ op, args });
    sent.push({ table, op, args });
  };
  const q = {
    select: (...a: unknown[]) => {
      record("select", a);
      return q;
    },
    eq: (...a: unknown[]) => {
      record("eq", a);
      return q;
    },
    in: (...a: unknown[]) => {
      record("in", a);
      return q;
    },
    or: (...a: unknown[]) => {
      record("or", a);
      return q;
    },
    neq: (...a: unknown[]) => {
      record("neq", a);
      return q;
    },
    not: (...a: unknown[]) => {
      record("not", a);
      return q;
    },
    is: (...a: unknown[]) => { record("is", a); return q; },
    lt: (...a: unknown[]) => { record("lt", a); return q; },
    lte: (...a: unknown[]) => {
      record("lte", a);
      return q;
    },
    order: (...a: unknown[]) => {
      record("order", a);
      return q;
    },
    limit: (...a: unknown[]) => {
      record("limit", a);
      return q;
    },
    maybeSingle: async () => {
      record("maybeSingle", []);
      const r = resolveResponder(table, calls);
      return r instanceof Promise ? r : r;
    },
    insert: async (...a: unknown[]) => {
      record("insert", a);
      const r = resolveResponder(table, calls);
      return r instanceof Promise ? r : r;
    },
    upsert: async (...a: unknown[]) => {
      record("upsert", a);
      const r = resolveResponder(table, calls);
      return r instanceof Promise ? r : r;
    },
    update: (...a: unknown[]) => {
      record("update", a);
      return q;
    },
    delete: () => {
      record("delete", []);
      return q;
    },
    then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
      const r = resolveResponder(table, calls);
      Promise.resolve(r).then(resolve, reject);
    },
  };
  return q;
}

let beforeTimeoutRpc: ((row: Row) => void) | undefined;
let timeoutRpcFails = false;
let openRpcError = false;
let openRpcResult: string | undefined;

function installClient(row: Row | null) {
  const sb = {
    from: vi.fn((table: string) => makeQuery(table)),
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      sent.push({ table: name, op: "rpc", args: [args] });
      if (name === "open_pairing_request") {
        if (openRpcError) return { data: null, error: { message: "Open failed" } };
        if (openRpcResult) return { data: openRpcResult, error: null };
        if (!row) return { data: "not_found", error: null };
        if (row.repair_pro_id !== args.p_pro_id) return { data: "forbidden", error: null };
        if (["selected_review", "reserved"].includes(row.pairing_stage || "")) return { data: "noop", error: null };
        if (!["waiting_for_selected", "waiting_for_pro"].includes(row.pairing_stage || "")) return { data: "closed", error: null };
        const stage = row.pairing_stage === "waiting_for_selected" ? "selected_review" : "reserved";
        const patch = { pairing_stage: stage, flow_status: stage, reservation_status: "active",
          pairing_deadline: row.pairing_deadline, idempotency_key: args.p_idempotency_key };
        Object.assign(row, patch);
        sent.push({ table: "request_reservations", op: "insert", args: [{ stage, status: "active" }] });
        sent.push({ table: "service_requests", op: "update", args: [patch] });
        return { data: "opened", error: null };
      }
      if (name === "dispatch_pairing_offer") {
        if (!row || row.repair_pro_id || row.pairing_stage == null) return { data: "noop", error: null };
        // Model the transaction's effects for these existing orchestration tests;
        // rollback, lock contention and permissions run in the PostgreSQL fixture.
        const patch = { pairing_stage: "waiting_for_pro", flow_status: "waiting_for_pro",
          repair_pro_id: args.p_pro_id, queue_position: Number(row.queue_position || 0) + 1 };
        Object.assign(row, patch);
        sent.push({ table: "service_requests", op: "update", args: [patch] });
        sent.push({ table: "request_pairing_queue", op: "upsert", args: [{ pro_id: args.p_pro_id, status: "offered" }] });
        return { data: "dispatched", error: null };
      }
      if (row) beforeTimeoutRpc?.(row);
      if (timeoutRpcFails) return { data: null, error: { message: "atomic settlement failed" } };
      if (!row || row.pairing_stage !== args.p_stage || row.pairing_deadline !== args.p_deadline ||
          row.repair_pro_id !== args.p_pro_id || row.updated_at !== args.p_updated_at) return { data: false, error: null };
      const ts = new Date().toISOString();
      const patch = { pairing_stage: "sequential_pairing", flow_status: "sequential_pairing",
        repair_pro_id: null, pairing_deadline: new Date(Date.now() + Number(args.p_retry_delay_ms)).toISOString(),
        reservation_status: "none", updated_at: ts,
        status_history: [...(Array.isArray(row.status_history) ? row.status_history : []),
          { status: "sequential_pairing", at: ts, by: "sweep:timeout" }] };
      Object.assign(row, patch);
      // Database effects are represented in the harness; real atomicity is checked by the PostgreSQL fixture.
      sent.push({ table: "service_requests", op: "update", args: [patch] });
      sent.push({ table: "request_pairing_queue", op: "update", args: [{ status: "timed_out", result_note: "pairing deadline exceeded" }] });
      return { data: true, error: null };
    }),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  if (row) {
    // Stateful responder: apply update patches to the in-memory row so that
    // recursive radius expansion in advancePairing actually terminates.
    // `maybeSingle` queries (loadPairingRow) want a single row; everything
    // else (the sweep select) wants an array.
    responders["service_requests"] = (calls) => {
      const isNull = calls.find((c) => c.op === "is" && c.args[1] === null);
      if (isNull && row[isNull.args[0] as keyof Row] != null) return { data: [], error: null };
      const updateOp = calls.find((c) => c.op === "update");
      if (updateOp) Object.assign(row, updateOp.args[0]);
      if (calls.some((c) => c.op === "maybeSingle")) {
        return { data: row, error: null };
      }
      return { data: [row], error: null };
    };
  }
  return sb;
}

function callsFor(table: string, op?: string) {
  return sent.filter((c) => c.table === table && (!op || c.op === op));
}

beforeEach(() => {
  sent.length = 0;
  beforeTimeoutRpc = undefined; timeoutRpcFails = false; openRpcError = false; openRpcResult = undefined;
  for (const k of Object.keys(responders)) delete responders[k];
  createServiceSupabaseMock.mockClear();
});

describe("openRequest idempotency & race safety", () => {
  it("creates one active reservation and moves waiting_for_selected → selected_review", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "waiting_for_selected" };
    installClient(row);
    responders["request_reservations"] = () => ({ data: null, error: null });

    const res = await openRequest("job-1", "pro-1", "k-1");

    if (!res.ok) console.error("OPEN_ERR", res.error, res.status);
    expect(res.ok).toBe(true);
    const reservations = callsFor("request_reservations", "insert");
    expect(reservations).toHaveLength(1);
    const inserted = reservations[0].args[0] as Record<string, unknown>;
    expect(inserted.stage).toBe("selected_review");
    expect(inserted.status).toBe("active");

    const updates = callsFor("service_requests", "update");
    expect(updates).toHaveLength(1);
    const patch = updates[0].args[0] as Record<string, unknown>;
    expect(patch.pairing_stage).toBe("selected_review");
    expect(patch.idempotency_key).toBe("k-1");
    expect(callsFor("open_pairing_request", "rpc")[0].args[0]).toMatchObject({
      p_request_id: "job-1", p_pro_id: "pro-1", p_window_ms: 144_000, p_rearm_floor_ms: 10_000,
    });
  });

  it("replays with the same idempotency key are no-ops (no second reservation)", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "waiting_for_selected",
      idempotency_key: "k-1",
    };
    installClient(row);
    responders["request_reservations"] = () => ({ data: null, error: null });

    const first = await openRequest("job-1", "pro-1", "k-1");
    expect(first.ok).toBe(true);
    const second = await openRequest("job-1", "pro-1", "k-1");
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.noop).toBe(true);
    expect(callsFor("request_reservations", "insert")).toHaveLength(1);
    expect(callsFor("service_requests", "update")).toHaveLength(1);
  });

  it("re-opening an existing review is an idempotent no-op", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "selected_review" };
    installClient(row);
    const res = await openRequest("job-1", "pro-1");
    expect(res).toMatchObject({ ok: true, noop: true });
    expect(callsFor("request_reservations", "insert")).toHaveLength(0);
  });

  it("rejects a pro who is not the current holder (403)", async () => {
    installClient(FULL_ROW);
    const res = await openRequest("job-1", "pro-other");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(403);
  });

  it("fails closed when the Open transaction is unavailable", async () => {
    installClient({ ...FULL_ROW }); openRpcError = true;
    expect(await openRequest("job-1", "pro-1", "k-2")).toMatchObject({ ok: false, status: 503 });
    expect(callsFor("request_reservations", "insert")).toHaveLength(0);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });

  it("does not create a reservation when the locked request is already closed", async () => {
    installClient({ ...FULL_ROW }); openRpcResult = "closed";
    expect(await openRequest("job-1", "pro-1", "k-race")).toMatchObject({ ok: false, status: 409 });
    expect(callsFor("request_reservations", "insert")).toHaveLength(0);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });
});

describe("confirmRequest assignment point", () => {
  it("confirms the reservation, arms the 20-min negotiation clock, and clears pairing_stage", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "reserved" };
    installClient(row);
    responders["request_reservations"] = () => ({ data: null, error: null });

    const before = Date.now();
    const res = await confirmRequest("job-1", "pro-1", "k-3");
    expect(res.ok).toBe(true);

    const resUpdates = callsFor("request_reservations", "update");
    expect(resUpdates).toHaveLength(1);
    const resPatch = resUpdates[0].args[0] as Record<string, unknown>;
    expect(resPatch.status).toBe("confirmed");
    expect(resPatch.released_by).toBe("confirm");

    const updates = callsFor("service_requests", "update");
    const patch = updates[0].args[0] as Record<string, unknown>;
    // pairing_stage cleared so post-assign SSPE paths never re-enter pairing
    expect(patch.pairing_stage).toBeNull();
    expect(patch.flow_status).toBe("negotiating");
    expect(patch.pairing_deadline).toBeNull();
    expect(patch.reservation_status).toBe("confirmed");
    expect(patch.assignment_status).toBe("assigned");
    const armed = Date.parse(String(patch.negotiate_ends_at));
    expect(Number.isFinite(armed)).toBe(true);
    expect(armed - before).toBeGreaterThanOrEqual(19 * 60_000);

    const { recalculateMerit } =
      await import("@/lib/server/merit/merit-engine");
    expect(recalculateMerit).toHaveBeenCalledWith("pro-1");
  });

  it("replays with the same idempotency key are no-ops", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: null,
      flow_status: "negotiating",
      assignment_status: "assigned",
      reservation_status: "confirmed",
      idempotency_key: "k-4",
    };
    installClient(row);
    responders["request_reservations"] = () => ({ data: null, error: null });

    const res = await confirmRequest("job-1", "pro-1", "k-4");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.noop).toBe(true);
    expect(callsFor("request_reservations", "update")).toHaveLength(0);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });

  it("rejects confirming from waiting_for_pro (must Open first) (409)", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "waiting_for_pro" };
    installClient(row);
    const res = await confirmRequest("job-1", "pro-1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(409);
  });

  it("reverts the confirmation when the stage CAS matches 0 rows (sweep raced)", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "selected_review" };
    installClient(row);
    responders["request_reservations"] = () => ({ data: null, error: null });
    responders["request_pairing_queue"] = () => ({ data: null, error: null });
    responders["service_requests"] = (calls) => {
      if (calls.some((c) => c.op === "maybeSingle")) {
        return { data: row, error: null };
      }
      return { data: [], error: null };
    };

    const res = await confirmRequest("job-1", "pro-1", "k-race2");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(409);

    const reverted = callsFor("request_reservations", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.status === "cancelled" && p.released_by === "confirm_race";
    });
    expect(reverted).toBeTruthy();
  });
});

describe("declineRequest per-request permanent exclusion (D6)", () => {
  it("writes excluded:<proId> history, marks queue declined, and advances to the next pro", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "waiting_for_selected" };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: null, error: null });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-2",
          business_name: "Beta",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    responders["profiles"] = () => ({
      data: { full_name: "Beta", avatar_url: null },
      error: null,
    });

    const res = await declineRequest("job-1", "pro-1", "Too far away");
    expect(res.ok).toBe(true);

    const queueUpdates = callsFor("request_pairing_queue", "update");
    expect(queueUpdates).toHaveLength(1);
    const qPatch = queueUpdates[0].args[0] as Record<string, unknown>;
    expect(qPatch.status).toBe("declined");

    const updates = callsFor("service_requests", "update");
    const declinePatch = updates[0].args[0] as Record<string, unknown>;
    const history = declinePatch.status_history as Array<{
      by?: string;
      note?: string;
    }>;
    const excluded = history.find((h) => h.by === "excluded:pro-1");
    expect(excluded).toBeTruthy();
    const note = history.find((h) => h.by === "declined:pro-1");
    expect(note?.note).toBe("Too far away");

    // advancePairing hands off to the next pro at the same radius (merit order).
    const advanceUpdates = updates[1]?.args[0] as Record<string, unknown>;
    expect(advanceUpdates.pairing_stage).toBe("waiting_for_pro");
    expect(advanceUpdates.repair_pro_id).toBe("pro-2");
  });

  it("never creates a cross-request cooldown (only per-request history markers)", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "waiting_for_pro" };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: null, error: null });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-2",
          business_name: "Beta",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    responders["profiles"] = () => ({ data: null, error: null });

    await declineRequest("job-1", "pro-1");
    const allPatches = callsFor("service_requests", "update").map(
      (c) => c.args[0] as Record<string, unknown>,
    );
    const history = (allPatches[0].status_history ?? []) as Array<{
      by?: string;
    }>;
    expect(history.some((h) => h.by === "excluded:pro-1")).toBe(true);
  });
});

describe("timeoutRequest sweep enforcement", () => {
  it("never settles or advances a sequential_pairing row (noop)", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "sequential_pairing" };
    installClient(row);
    const res = await timeoutRequest("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.noop).toBe(true);
    expect(callsFor("request_pairing_queue", "update")).toHaveLength(0);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });

  it("times out an unresponsive waiting_for_pro and advances", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "waiting_for_pro",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: null, error: null });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-2",
          business_name: "Beta",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    responders["profiles"] = () => ({ data: null, error: null });

    const res = await timeoutRequest("job-1");
    expect(res.ok).toBe(true);

    const qPatch = callsFor("request_pairing_queue", "update")[0]
      .args[0] as Record<string, unknown>;
    expect(qPatch.status).toBe("timed_out");
    expect(qPatch.result_note).toContain("pairing deadline exceeded");

    const advancePatch = callsFor("service_requests", "update").at(-1)
      ?.args[0] as Record<string, unknown>;
    expect(advancePatch.pairing_stage).toBe("waiting_for_pro");
    expect(advancePatch.repair_pro_id).toBe("pro-2");
  });

  it.each(["rearm", "confirm"])("never settles a %s after the final read", async (race) => {
    const row: Row = { ...FULL_ROW, pairing_stage: "reserved", pairing_deadline: new Date(Date.now() - 1000).toISOString() };
    installClient(row);
    beforeTimeoutRpc = (fresh) => {
      fresh.pairing_deadline = race === "rearm" ? new Date(Date.now() + 10000).toISOString() : null;
      fresh.pairing_stage = race === "rearm" ? "reserved" : null;
      fresh.flow_status = race === "rearm" ? "reserved" : "negotiating";
      fresh.updated_at = "new";
    };
    expect(await timeoutRequest("job-1")).toMatchObject({ ok: true, noop: true });
    expect(callsFor("request_pairing_queue", "update")).toHaveLength(0);
    expect(callsFor("request_reservations", "update")).toHaveLength(0);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });
  it("leaves failed atomic settlement retryable without partial Node writes", async () => {
    const row: Row = { ...FULL_ROW, pairing_deadline: new Date(Date.now() - 1000).toISOString() };
    installClient(row); timeoutRpcFails = true;
    expect(await timeoutRequest("job-1")).toMatchObject({ ok: false, status: 500 });
    expect(row.pairing_stage).toBe("waiting_for_selected");
    expect(callsFor("request_pairing_queue", "update")).toHaveLength(0);
    timeoutRpcFails = false;
    expect(await timeoutRequest("job-1")).toMatchObject({ ok: true });
  });

  it("is a noop when the deadline was refreshed mid-sweep (pro just opened)", async () => {
    // The sweep selected the row while its deadline had lapsed, but the pro
    // opened (refreshing pairing_deadline) before timeoutRequest ran. The
    // timeout must not settle or advance the fresh window.
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "selected_review",
      pairing_deadline: new Date(Date.now() + 30_000).toISOString(),
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: null, error: null });

    const res = await timeoutRequest("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.noop).toBe(true);
    expect(callsFor("request_pairing_queue", "update")).toHaveLength(0);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });

  it("is a noop when the stage CAS loses the confirm race", async () => {
    // confirmRequest already moved the row to negotiating the stale timeout's
    // CAS on the old stage matches nothing, so nothing advances.
    const row: Row = { ...FULL_ROW, pairing_stage: "negotiating" };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: null, error: null });

    const res = await timeoutRequest("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.noop).toBe(true);
  });
});

describe("confirmRequest marks the queue accepted (race-safe vs sweep)", () => {
  it("writes status=accepted to the queue so a racing timeout never marks it timed_out", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "selected_review" };
    installClient(row);
    responders["request_reservations"] = () => ({ data: null, error: null });
    responders["request_pairing_queue"] = () => ({ data: null, error: null });

    const res = await confirmRequest("job-1", "pro-1", "k-acc");
    expect(res.ok).toBe(true);

    const qUpdate = callsFor("request_pairing_queue", "update").find(
      (c) => (c.args[0] as Record<string, unknown>).status === "accepted",
    );
    expect(qUpdate).toBeTruthy();
  });
});

describe("deferRequest Later defers pro and advances immediately (D5)", () => {
  it("records deferred, moves to sequential_pairing, and advances pairing", async () => {
    const row: Row = { ...FULL_ROW, pairing_stage: "waiting_for_pro" };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: null, error: null });
    responders["request_reservations"] = () => ({ data: null, error: null });

    const { deferRequest } =
      await import("@/lib/server/pairing/pairing-engine");
    const res = await deferRequest("job-1", "pro-1");
    expect(res.ok).toBe(true);

    const qPatch = callsFor("request_pairing_queue", "update").find(
      (c) => (c.args[0] as Record<string, unknown>).status === "deferred",
    );
    expect(qPatch).toBeTruthy();

    // Immediate next pro: stage flips to sequential_pairing (then advancePairing).
    const srUpdates = callsFor("service_requests", "update");
    expect(srUpdates.length).toBeGreaterThanOrEqual(1);
    const stagePatch = srUpdates.find(
      (c) =>
        (c.args[0] as Record<string, unknown>).pairing_stage ===
        "sequential_pairing",
    );
    expect(stagePatch).toBeTruthy();
  });
});

describe("advancePairing never clobbers an assigned negotiation", () => {
  it("is a no-op when the job has already advanced to negotiating", async () => {
    // Simulates the race: a stale decline/defer/timeout read the row while it
    // was "reserved", but the pro "I can fix this" (confirmRequest) already moved
    // it to negotiating. advancePairing must NOT flip it back to sequential
    // pairing otherwise the 20-min negotiation "closes after a few seconds".
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "negotiating",
      reservation_status: "confirmed",
      assignment_status: "assigned",
    };
    installClient(row);
    const res = await advancePairing("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.noop).toBe(true);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
    expect(callsFor("request_pairing_queue", "insert")).toHaveLength(0);
  });
});

describe("sweepPairing recovery loop", () => {
  it("sweeps a fresh waiting_for_selected row whose reservation_status is NULL (stuck-chosen-pro bug)", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "waiting_for_selected",
      reservation_status: null,
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: [], error: null });
    responders["repair_pro_profiles"] = () => ({ data: [], error: null });

    const res = await sweepPairing();
    expect(res.checked).toBe(1);
    // Must have been timed out of the chosen-pro wait (not skipped forever).
    const timedOut = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === "sequential_pairing";
    });
    expect(timedOut).toBeTruthy();
  });

  it("advances expired sequential_pairing holds (refreshes search) instead of timing out", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "sequential_pairing",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
      repair_pro_id: null,
      pairing_radius_km: 1,
      radius_km: 5,
    };
    installClient(row);
    // Sweep select + loadPairingRow share the same stateful responder.
    responders["request_pairing_queue"] = () => ({ data: [], error: null });
    responders["repair_pro_profiles"] = () => ({ data: [], error: null });

    const res = await sweepPairing();
    expect(res.checked).toBe(1);
    // No candidates → radius expands within the fresh-search cap (1 → 2, not a
    // hard timeout and never beyond the 2 km round-0 cap).
    const radiusUpdate = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_radius_km === 2;
    });
    expect(radiusUpdate).toBeTruthy();
    expect(
      callsFor("service_requests", "update").some(
        (c) => (c.args[0] as Record<string, unknown>).pairing_radius_km === 5,
      ),
    ).toBe(false);
    expect(
      callsFor("request_pairing_queue", "update").filter(
        (c) => (c.args[0] as Record<string, unknown>).status === "timed_out",
      ),
    ).toHaveLength(0);
  });

  it("times out expired waiting_for_pro rows and hands to the next pro", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "waiting_for_pro",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: [], error: null });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-2",
          business_name: "Beta",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    responders["profiles"] = () => ({ data: null, error: null });

    const res = await sweepPairing();
    expect(res.checked).toBe(1);
    const timedOut = callsFor("request_pairing_queue", "update").filter(
      (c) => (c.args[0] as Record<string, unknown>).status === "timed_out",
    );
    expect(timedOut).toHaveLength(1);
    const advancePatch = callsFor("service_requests", "update")
      .map((c) => c.args[0] as Record<string, unknown>)
      .filter((p) => p.repair_pro_id && p.pairing_stage === "waiting_for_pro")
      .at(0);
    expect(advancePatch?.repair_pro_id).toBe("pro-2");
  });
});

describe("pairing sweep failure reporting", () => {
  it("does not turn a failed overdue scan into a successful empty sweep", async () => {
    installClient({ ...FULL_ROW });
    responders["service_requests"] = () => ({ data: null, error: { message: "db unavailable" } });
    await expect(sweepPairing()).rejects.toThrow("load overdue");
  });
  it.each(["request_pairing_queue", "repair_pro_profiles"])("never expires a search on a failed %s read", async (table) => {
    installClient({ ...FULL_ROW, pairing_stage: "sequential_pairing", repair_pro_id: null });
    responders[table] = () => ({ data: null, error: { message: "unavailable" } });
    await expect(advancePairing("job-1")).rejects.toThrow("load pairing");
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });
  it("keeps a search retryable when its radius update fails", async () => {
    const row: Row = { ...FULL_ROW, repair_pro_id: null, pairing_stage: "sequential_pairing", pairing_radius_km: 1,
      radius_km: 5, queue_position: 2, pairing_deadline: new Date(Date.now() - 1000).toISOString() };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: [], error: null });
    responders["repair_pro_profiles"] = () => ({ data: [], error: null });
    responders["service_requests"] = (calls) => calls.some((call) => call.op === "update")
      ? { data: null, error: { message: "radius write failed" } }
      : { data: calls.some((call) => call.op === "maybeSingle") ? row : [row], error: null };
    expect(await advancePairing("job-1")).toMatchObject({ ok: false, status: 500 });
    await expect(sweepPairing()).rejects.toThrow("transition failed");
    expect(row.pairing_stage).toBe("sequential_pairing");
    expect(callsFor("service_requests", "update").some((call) =>
      (call.args[0] as Record<string, unknown>).flow_status === "expired")).toBe(false);
  });
  it("reports fallback deadline arming failures", async () => {
    installClient({ ...FULL_ROW });
    responders["service_requests"] = (calls) => calls.some((call) => call.op === "update")
      ? { data: null, error: { message: "write failed" } }
      : { data: calls.some((call) => call.op === "is") ? [{ id: "unarmed", updated_at: "old" }] : [], error: null };
    await expect(sweepPairing()).rejects.toThrow("arm pairing");
  });
  it("bounds fallback arming and checks the unchanged snapshot", async () => {
    installClient({ ...FULL_ROW });
    responders["service_requests"] = (calls) => ({ data: calls.some((call) => call.op === "is") &&
      !calls.some((call) => call.op === "update") ? [{ id: "unarmed", updated_at: "old" }] : [], error: null });
    expect(await sweepPairing(1)).toMatchObject({ checked: 0, unarmedBatchFull: true });
    expect(callsFor("service_requests", "limit").map((call) => call.args[0])).toEqual([1, 1]);
    expect(callsFor("service_requests", "eq")).toContainEqual({ table: "service_requests", op: "eq", args: ["updated_at", "old"] });
    expect(callsFor("service_requests", "is").filter((call) => call.args[0] === "pairing_deadline")).toHaveLength(2);
  });
  it("does not timeout an offer before any deadline was armed", async () => {
    installClient({ ...FULL_ROW, pairing_deadline: null });
    expect(await timeoutRequest("job-1")).toMatchObject({ ok: true, noop: true });
    expect(callsFor("request_pairing_queue", "update")).toHaveLength(0);
    expect(callsFor("service_requests", "update")).toHaveLength(0);
  });
});

describe("advancePairing 5-round cap & recycling", () => {
  it("expires the request once MAX_PAIRING_ATTEMPTS rounds have run", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "sequential_pairing",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
      queue_position: MAX_PAIRING_ATTEMPTS,
      repair_pro_id: null,
    };
    installClient(row);

    const res = await advancePairing("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.expired).toBe(true);

    const expirePatch = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === null && p.status === "expired";
    });
    expect(expirePatch).toBeTruthy();
    // No dispatch happened after the cap.
    expect(callsFor("request_pairing_queue", "upsert")).toHaveLength(0);
  });

  it("reports noop (not expired) when the expire CAS matches 0 rows (confirm raced)", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "sequential_pairing",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
      queue_position: MAX_PAIRING_ATTEMPTS,
    };
    installClient(row);
    // loadPairingRow still sees the pairing row, but the expire UPDATE matches
    // 0 rows (a pro confirmed in the meantime) → never claim expired.
    responders["service_requests"] = (calls) => {
      if (calls.some((c) => c.op === "maybeSingle")) {
        return { data: row, error: null };
      }
      return { data: [], error: null };
    };

    const res = await advancePairing("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.expired).toBeFalsy();
      expect(res.noop).toBe(true);
    }
  });

  it("expires when unique Live pool is empty (no same-pro recycle / ghost 3rd)", async () => {
    const fresh = new Date().toISOString();
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "sequential_pairing",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
      repair_pro_id: null,
      pairing_radius_km: 50,
      queue_position: 2,
      created_at: new Date(Date.now() - 60_000).toISOString(),
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({
      data: [
        { pro_id: "pro-1", status: "timed_out", responded_at: null },
        { pro_id: "pro-2", status: "timed_out", responded_at: null },
      ],
      error: null,
    });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-1",
          business_name: "Alpha",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
        {
          user_id: "pro-2",
          business_name: "Beta",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
      ],
      error: null,
    });

    const res = await advancePairing("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.expired).toBe(true);

    // Must not re-dispatch a timed_out pro
    const dispatchPatch = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === "waiting_for_pro";
    });
    expect(dispatchPatch).toBeFalsy();
    expect(callsFor("request_pairing_queue", "upsert")).toHaveLength(0);

    const expirePatch = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === null && p.status === "expired";
    });
    expect(expirePatch).toBeTruthy();
    const patch = expirePatch?.args[0] as Record<string, unknown>;
    expect(patch.repair_pro_id).toBeNull();
  });

  it("expires after deferred + timed_out when no third unique Live pro exists", async () => {
    const fresh = new Date().toISOString();
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "sequential_pairing",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
      repair_pro_id: null,
      pairing_radius_km: 10,
      queue_position: 2,
      created_at: new Date(Date.now() - 120_000).toISOString(),
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({
      data: [
        {
          pro_id: "pro-1",
          status: "deferred",
          responded_at: new Date().toISOString(),
        },
        {
          pro_id: "pro-2",
          status: "timed_out",
          responded_at: new Date(Date.now() - 1000).toISOString(),
        },
      ],
      error: null,
    });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-1",
          business_name: "Alpha",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
        {
          user_id: "pro-2",
          business_name: "Beta",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
      ],
      error: null,
    });

    const res = await advancePairing("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.expired).toBe(true);
    expect(callsFor("request_pairing_queue", "upsert")).toHaveLength(0);
  });

  it("dispatches a fresh unique pro when one exists (no recycle needed)", async () => {
    const fresh = new Date().toISOString();
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "sequential_pairing",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
      repair_pro_id: null,
      pairing_radius_km: 50,
      queue_position: 2,
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({
      data: [
        { pro_id: "pro-1", status: "timed_out", responded_at: null },
        { pro_id: "pro-2", status: "timed_out", responded_at: null },
      ],
      error: null,
    });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-1",
          business_name: "Alpha",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
        {
          user_id: "pro-2",
          business_name: "Beta",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
        {
          user_id: "pro-3",
          business_name: "Gamma",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
      ],
      error: null,
    });
    responders["profiles"] = () => ({
      data: { full_name: "Gamma", avatar_url: null },
      error: null,
    });

    const res = await advancePairing("job-1");
    expect(res.ok).toBe(true);
    const dispatchPatch = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === "waiting_for_pro";
    });
    expect(dispatchPatch).toBeTruthy();
    const patch = dispatchPatch?.args[0] as Record<string, unknown>;
    expect(patch.repair_pro_id).toBe("pro-3");
  });

  it("excludes a stale-heartbeat pro (ghost online) from dispatch", async () => {
    const stale = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const fresh = new Date().toISOString();
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: "sequential_pairing",
      pairing_deadline: new Date(Date.now() - 1000).toISOString(),
      repair_pro_id: null,
      pairing_radius_km: 15,
      queue_position: 1,
      created_at: new Date().toISOString(),
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({
      data: [],
      error: null,
    });
    responders["repair_pro_profiles"] = () => ({
      data: [
        // pro-ghost: is_online=true but heartbeat stale → must be excluded.
        {
          user_id: "pro-ghost",
          business_name: "Ghost",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: stale,
        },
        {
          user_id: "pro-live",
          business_name: "Live",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
      ],
      error: null,
    });
    responders["profiles"] = () => ({
      data: { full_name: "Live", avatar_url: null },
      error: null,
    });

    const res = await advancePairing("job-1");
    expect(res.ok).toBe(true);

    const dispatchPatch = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === "waiting_for_pro";
    });
    expect(dispatchPatch).toBeTruthy();
    const patch = dispatchPatch?.args[0] as Record<string, unknown>;
    expect(patch.repair_pro_id).toBe("pro-live");
  });

  it("retrySearch resets an exhausted request back to sequential_pairing and re-dispatches", async () => {
    const fresh = new Date().toISOString();
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: null,
      pairing_deadline: null,
      flow_status: "expired",
      status: "expired",
      queue_position: 3,
      pairing_radius_km: 10,
      created_at: new Date().toISOString(),
      status_history: [
        { status: "expired", at: fresh, by: "pairing_exhausted" },
      ],
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: [], error: null });
    responders["repair_pro_profiles"] = () => ({
      data: [
        {
          user_id: "pro-1",
          business_name: "Alpha",
          primary_service: "auto",
          lat: 6.5,
          lng: 3.3,
          location_updated_at: fresh,
        },
      ],
      error: null,
    });
    responders["profiles"] = () => ({
      data: { full_name: "Alpha", avatar_url: null },
      error: null,
    });

    const res = await retrySearch("job-1");
    expect(res.ok).toBe(true);

    // The retry re-opened the request into sequential pairing.
    const retryUpdate = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return (
        p.by === undefined &&
        (c.args[0] as Record<string, unknown>).status === "requested"
      );
    });
    expect(retryUpdate).toBeTruthy();
    const patch = retryUpdate?.args[0] as Record<string, unknown>;
    expect(patch.pairing_stage).toBe("sequential_pairing");
    expect(patch.queue_position).toBe(0);

    // Retry recorded a marker so the client can show the remaining retries.
    expect(row.status_history).toContainEqual(
      expect.objectContaining({ by: "retry_search" }),
    );

    // And the fresh search dispatched a pro (waiting_for_pro).
    const dispatchPatch = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === "waiting_for_pro";
    });
    expect(dispatchPatch).toBeTruthy();
  });

  it("retrySearch holds an old request searching for the full 144s window when no pro is found (no instant 2s exhaust)", async () => {
    const fresh = new Date().toISOString();
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: null,
      pairing_deadline: null,
      flow_status: "expired",
      status: "expired",
      queue_position: 3,
      pairing_radius_km: 10,
      // Old request the old "hold only ≤15s after creation" rule would
      // instantly exhaust a Retry of this request.
      created_at: new Date(Date.now() - 120_000).toISOString(),
      status_history: [
        { status: "expired", at: fresh, by: "pairing_exhausted" },
      ],
    };
    installClient(row);
    responders["request_pairing_queue"] = () => ({ data: [], error: null });
    responders["repair_pro_profiles"] = () => ({ data: [], error: null });

    const res = await retrySearch("job-1");
    expect(res.ok).toBe(true);

    // Retry re-opened the request into sequential pairing with a fresh window.
    const retryUpdate = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return (
        p.status === "requested" && p.pairing_stage === "sequential_pairing"
      );
    });
    expect(retryUpdate).toBeTruthy();

    // No pro found → the round holds searching (sequential_pairing); it must
    // NOT instantly mark the request expired just because the request is old.
    const expirePatch = callsFor("service_requests", "update").find((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === null && p.status === "expired";
    });
    expect(expirePatch).toBeFalsy();

    // The hold keeps a future pairing_deadline armed so the sweep re-advances
    // the search and only exhausts after the full 144s window lapses.
    expect(row.pairing_deadline).toBeTruthy();
    expect(Date.parse(String(row.pairing_deadline)) > Date.now()).toBe(true);
  });

  it("retrySearch no-ops once MAX_PAIRING_RETRIES markers are recorded", async () => {
    const row: Row = {
      ...FULL_ROW,
      pairing_stage: null,
      pairing_deadline: null,
      flow_status: "expired",
      status: "expired",
      status_history: [
        { status: "expired", at: "2026-01-01", by: "pairing_exhausted" },
        { status: "sequential_pairing", at: "2026-01-01", by: "retry_search" },
        { status: "sequential_pairing", at: "2026-01-01", by: "retry_search" },
        { status: "sequential_pairing", at: "2026-01-01", by: "retry_search" },
      ],
    };
    installClient(row);
    // No pros online would otherwise cause a sweep; the noop must not reach any.
    const before = sent.length;

    const res = await retrySearch("job-1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.noop).toBe(true);
    expect(callsFor("service_requests", "update").length).toBe(
      before === 0 ? 0 : callsFor("service_requests", "update").length,
    );
    // No update was written on the expired job.
    const written = callsFor("service_requests", "update").some((c) => {
      const p = c.args[0] as Record<string, unknown>;
      return p.pairing_stage === "sequential_pairing";
    });
    expect(written).toBe(false);
  });
});
