import { beforeEach, describe, expect, it, vi } from "vitest";
import { expireNegotiationIfOverdue, sweepNegotiationDeadlines } from "../negotiation-expiry";
import { rowToJob } from "@/lib/server/jobs/job-store/mappers";
import { insertNotification } from "@/lib/server/notifications";

vi.mock("@/lib/server/jobs/deadlines/sweep-lease", () => ({
  withSweepLease: async (_scope: string, operation: () => Promise<unknown>) => operation(),
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => ({ from }) }));
vi.mock("@/lib/server/notifications", () => ({ insertNotification: vi.fn(async () => ({ id: "notice" })) }));
let rows: Record<string, unknown>[];
let events: unknown[];
let failRead: boolean;
let failWrite: boolean;
let beforeWrite: (() => void) | undefined;
const calls: { operation: string; column?: string; value?: unknown }[] = [];
function from(table: string) {
  let patch: Record<string, unknown> | undefined;
  let limit = 1000;
  const filters: ((row: Record<string, unknown>) => boolean)[] = [];
  const execute = () => {
    if ((patch && failWrite) || (!patch && failRead)) return { data: null, error: { message: "db failure" } };
    if (patch) { beforeWrite?.(); beforeWrite = undefined; }
    const matches = rows.filter((row) => filters.every((check) => check(row)))
      .sort((a, b) => String(a.negotiate_ends_at).localeCompare(String(b.negotiate_ends_at))).slice(0, limit);
    if (patch) matches.forEach((row) => {
      Object.assign(row, patch);
      if (table === "service_requests") row.job_version = Number(row.job_version || 0) + 1;
    });
    return { data: matches.map((row) => ({ ...row })), error: null };
  };
  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => { calls.push({ operation: "eq", column, value }); filters.push((row) => row[column] === value); return query; },
    not: (column: string, _op: string, value: unknown) => { filters.push((row) => row[column] !== value); return query; },
    lt: (column: string, value: string) => { filters.push((row) => typeof row[column] === "string" && String(row[column]) < value); return query; },
    order: (column: string) => { calls.push({ operation: "order", column }); return query; },
    limit: (value: number) => { limit = value; return query; },
    update: (value: Record<string, unknown>) => { patch = value; return query; },
    insert: async (event: unknown) => { if (table === "job_events") events.push(event); return { error: null }; },
    maybeSingle: async () => { const result = execute(); return { ...result, data: result.data?.[0] || null }; },
    then: (resolve: (value: unknown) => void) => Promise.resolve(execute()).then(resolve),
  };
  return query;
}
function row(id = "job", deadline = new Date(Date.now() - 1000).toISOString(), status = "negotiating") {
  return { id, flow_status: status, status: "accepted", motorist_id: "customer", repair_pro_id: "pro",
    job_version: 0,
    status_history: [{ status: "negotiating", by: "negotiation_timer_start", at: "start" }],
    negotiate_ends_at: deadline, updated_at: "old", offers: [], pickup_lat: 6, pickup_lng: 3,
    agreed_major: 2000, pairing_stage: "negotiating", reservation_status: "confirmed" };
}
beforeEach(() => {
  vi.clearAllMocks(); rows = [row()]; events = []; calls.length = 0;
  failRead = false; failWrite = false; beforeWrite = undefined;
});
describe("conditional negotiation expiry", () => {
  it("expires an armed overdue negotiation and preserves unrelated data", async () => {
    const result = await expireNegotiationIfOverdue(rowToJob(rows[0]));
    expect(result.status).toBe("expired");
    expect(rows[0]).toMatchObject({ flow_status: "expired", pairing_stage: null, reservation_status: null,
      pickup_lat: 6, agreed_major: 2000 });
    expect(events).toHaveLength(1);
    expect(insertNotification).toHaveBeenCalledTimes(1);
  });
  it.each(["future", "sentinel", "missing", "terminal"])("does not expire %s rows", async (kind) => {
    if (kind === "future") rows[0].negotiate_ends_at = new Date(Date.now() + 10000).toISOString();
    if (kind === "sentinel") rows[0].negotiate_ends_at = new Date(Date.now() + 60 * 86400000).toISOString();
    if (kind === "missing") rows[0].negotiate_ends_at = null;
    if (kind === "terminal") rows[0].flow_status = "cancelled";
    expect((await expireNegotiationIfOverdue(rowToJob(rows[0]))).status).not.toBe("expired");
    expect(events).toHaveLength(0);
    expect(insertNotification).not.toHaveBeenCalled();
  });
  it("deduplicates simultaneous expiry even from a stale snapshot", async () => {
    const snapshot = rowToJob(rows[0]);
    await Promise.all([expireNegotiationIfOverdue(snapshot), expireNegotiationIfOverdue(snapshot)]);
    expect(rows[0].status_history).toHaveLength(2);
    expect(events).toHaveLength(1);
    expect(insertNotification).toHaveBeenCalledTimes(1);
  });
  it.each(["agreed", "cancelled", "paid_booked"])("cannot overwrite a concurrent %s", async (status) => {
    const snapshot = rowToJob(rows[0]);
    beforeWrite = () => { rows[0].flow_status = status; rows[0].updated_at = "new"; };
    expect((await expireNegotiationIfOverdue(snapshot)).status).toBe(status);
    expect(events).toHaveLength(0);
  });
  it("does not expire a rearmed deadline even with the same timestamp", async () => {
    const snapshot = rowToJob(rows[0]);
    beforeWrite = () => { rows[0].negotiate_ends_at = new Date(Date.now() + 10000).toISOString(); };
    expect((await expireNegotiationIfOverdue(snapshot)).status).toBe("negotiating");
    expect(events).toHaveLength(0);
  });
  it("does not report memory success or emit effects on a failed write", async () => {
    failWrite = true;
    await expect(expireNegotiationIfOverdue(rowToJob(rows[0]))).rejects.toThrow("persist");
    expect(rows[0].flow_status).toBe("negotiating");
    expect(events).toHaveLength(0);
  });
});
describe("unattended bounded selection", () => {
  it("selects overdue negotiating rows rather than future or terminal rows", async () => {
    rows = [row("future", new Date(Date.now() + 10000).toISOString()), row("cancelled", undefined, "cancelled"),
      row("due-1", new Date(Date.now() - 3000).toISOString()), row("due-2", new Date(Date.now() - 2000).toISOString())];
    expect(await sweepNegotiationDeadlines(1)).toEqual({ checked: 1, expired: 1, batchFull: true });
    expect(rows.find((item) => item.id === "due-1")?.flow_status).toBe("expired");
    expect(await sweepNegotiationDeadlines(1)).toEqual({ checked: 1, expired: 1, batchFull: true });
    expect(await sweepNegotiationDeadlines(1)).toEqual({ checked: 0, expired: 0, batchFull: false });
  });
  it("surfaces database failure for retry", async () => {
    failRead = true;
    await expect(sweepNegotiationDeadlines()).rejects.toThrow("load");
  });
});
