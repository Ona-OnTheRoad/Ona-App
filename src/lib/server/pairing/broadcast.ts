import "server-only";
import { hasAlertableLocation, hasRecentLiveHeartbeat, MAX_RADIUS_KM } from "@/lib/matching";
import {
  BROADCAST_WINDOW_MS,
  broadcastStartedAtMs,
  proCanSeeBroadcast,
} from "@/lib/jobs/broadcast-tiers";
import type { JobRecord } from "@/lib/jobs/types";
import { clampProServiceRadiusKm } from "@/lib/profile-system";
import { isSyntheticAccount } from "@/lib/server/synthetic-accounts";
import type { createServiceSupabase } from "@/lib/supabase/server";
import { LEAN_JOB_COLUMNS } from "@/lib/server/jobs/job-store/constants";
import { rowToJob } from "@/lib/server/jobs/job-store/mappers";

type Sb = ReturnType<typeof createServiceSupabase>;

/**
 * Open-search dispatch mode. "broadcast" (default): every eligible pro in range
 * sees the job (nearest first, by tier) and the first to accept gets it.
 * "sequential": the legacy one-pro-at-a-time engine. This env switch is the
 * production rollback: set PAIRING_DISPATCH_MODE=sequential and redeploy.
 */
export function broadcastEnabled(): boolean {
  return process.env.PAIRING_DISPATCH_MODE !== "sequential";
}

/** Queue outcomes that keep a pro away from this request for good (or for the
 * 5 min Later window, which the queue row's responded_at bounds). */
const EXCLUDED_QUEUE = new Set(["declined", "timed_out", "skipped", "accepted", "deferred"]);
const DEFER_MS = 5 * 60_000;

export type PoolRow = {
  id: string;
  status: string | null;
  pairing_stage: string | null;
  repair_pro_id: string | null;
  status_history: unknown;
  created_at: string | null;
  radius_km: number | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  service_type: string;
  likely_trade_ids?: string[] | null;
  problem_text: string | null;
  description: string | null;
  motorist_id: string;
  motorist_name?: string | null;
};

export type BroadcastPro = {
  user_id: string;
  business_name: string | null;
  primary_service: string | null;
  services: unknown;
  lat: number | null;
  lng: number | null;
  location_updated_at: string | null;
  is_online: boolean | null;
  status: string | null;
  service_radius_km: number | null;
  profiles?: { email?: string | null; full_name?: string | null } | null;
};

const PRO_COLUMNS =
  "user_id, business_name, primary_service, services, lat, lng, location_updated_at, is_online, status, service_radius_km, profiles(email, full_name)";

export function kmBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = (aLat - bLat) * 111;
  const dLng = (aLng - bLng) * 111 * Math.cos((bLat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/** Customer's search radius, never above the platform cap. */
function customerRadiusKm(row: Pick<PoolRow, "radius_km">): number {
  const r = Number(row.radius_km);
  return Number.isFinite(r) && r > 0 ? Math.min(r, MAX_RADIUS_KM) : MAX_RADIUS_KM;
}

/** When this broadcast began and when it stops being claimable. */
export function broadcastWindow(row: Pick<PoolRow, "status_history" | "created_at">) {
  const startedAt = broadcastStartedAtMs(row.status_history, row.created_at) ?? Date.now();
  return { startedAt, endsAt: startedAt + BROADCAST_WINDOW_MS };
}

export function isOpenPoolRow(
  row: Pick<PoolRow, "pairing_stage" | "repair_pro_id" | "status"> | null | undefined,
): boolean {
  if (!row) return false;
  if (row.repair_pro_id) return false;
  if (row.pairing_stage !== "sequential_pairing") return false;
  return !["cancelled", "expired", "completed", "released"].includes(String(row.status));
}

async function dispatchTradesFor(row: PoolRow): Promise<string[]> {
  const stored = Array.isArray(row.likely_trade_ids) ? row.likely_trade_ids.filter(Boolean) : [];
  if (stored.length) return stored;
  const { resolveDispatchTrades } = await import("@/lib/callout/dispatch-trades");
  return resolveDispatchTrades(String(row.problem_text || row.description || ""), row.service_type)
    .dispatchTrades;
}

/**
 * Can this pro see/claim this open job right now? `atElapsedMs` overrides the
 * clock (use Infinity for "ignoring tier timing", e.g. is anyone reachable).
 */
export async function proCanSeePoolJob(
  pro: BroadcastPro,
  row: PoolRow,
  opts: {
    nowMs?: number;
    atElapsedMs?: number;
    trades?: string[];
    /** Push-alert check: accept a pin up to ALERTABLE_LOCATION_MAX_MS old (app closed). */
    alertOnly?: boolean;
  } = {},
): Promise<boolean> {
  const nowMs = opts.nowMs ?? Date.now();
  if (!pro.is_online || pro.lat == null || pro.lng == null) return false;
  if (pro.status === "suspended" || pro.status === "rejected") return false;
  const located = opts.alertOnly
    ? hasAlertableLocation(pro.location_updated_at, nowMs)
    : hasRecentLiveHeartbeat(pro.location_updated_at, nowMs);
  if (!located) return false;
  if (
    isSyntheticAccount({
      email: pro.profiles?.email,
      fullName: pro.profiles?.full_name,
      businessName: pro.business_name,
    })
  ) {
    return false;
  }
  const { proOffersAnyTrade } = await import("@/lib/callout/dispatch-trades");
  const trades = opts.trades ?? (await dispatchTradesFor(row));
  if (!proOffersAnyTrade(trades, pro)) return false;
  const cLat = Number(row.pickup_lat) || 0;
  const cLng = Number(row.pickup_lng) || 0;
  const distanceKm = kmBetween(Number(pro.lat), Number(pro.lng), cLat, cLng);
  const elapsedMs =
    opts.atElapsedMs ?? nowMs - broadcastWindow(row).startedAt;
  return proCanSeeBroadcast({
    distanceKm,
    elapsedMs,
    customerRadiusKm: customerRadiusKm(row),
    proRadiusKm: clampProServiceRadiusKm(pro.service_radius_km),
  });
}

async function loadPro(sb: Sb, proId: string): Promise<BroadcastPro | null> {
  const { data } = await sb
    .from("repair_pro_profiles")
    .select(PRO_COLUMNS)
    .eq("user_id", proId)
    .maybeSingle();
  return (data as unknown as BroadcastPro) ?? null;
}

async function excludedJobIds(sb: Sb, proId: string, jobIds: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (!jobIds.length) return out;
  const { data } = await sb
    .from("request_pairing_queue")
    .select("request_id, status, responded_at")
    .eq("pro_id", proId)
    .in("request_id", jobIds);
  const now = Date.now();
  for (const q of data ?? []) {
    const status = String(q.status);
    if (!EXCLUDED_QUEUE.has(status)) continue;
    if (status === "deferred") {
      const at = q.responded_at ? Date.parse(String(q.responded_at)) : Number.NaN;
      if (Number.isFinite(at) && now - at >= DEFER_MS) continue; // Later lapsed
    }
    out.add(String(q.request_id));
  }
  return out;
}

/**
 * Open jobs this pro can currently see, shaped as an offer addressed to them
 * (waiting_for_pro) so the existing incoming card works unchanged. Nothing is
 * assigned until the pro claims it.
 */
export async function listBroadcastOffersForPro(sb: Sb, proId: string): Promise<JobRecord[]> {
  if (!broadcastEnabled()) return [];
  const pro = await loadPro(sb, proId);
  if (!pro || !pro.is_online) return [];

  const { data, error } = await sb
    .from("service_requests")
    .select(`${LEAN_JOB_COLUMNS}, likely_trade_ids`)
    .eq("pairing_stage", "sequential_pairing")
    .is("repair_pro_id", null)
    .not("status", "in", "(cancelled,expired,completed,released)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<PoolRow & Record<string, unknown>>;
  if (!rows.length) return [];

  const blocked = await excludedJobIds(sb, proId, rows.map((r) => r.id));
  const now = Date.now();
  const out: JobRecord[] = [];
  for (const row of rows) {
    if (blocked.has(row.id) || row.motorist_id === proId) continue;
    if (!(await proCanSeePoolJob(pro, row, { nowMs: now }))) continue;
    const { endsAt } = broadcastWindow(row);
    if (now >= endsAt) continue;
    const job = rowToJob(row);
    out.push({
      ...job,
      repairProId: proId,
      repairProName: pro.business_name || job.repairProName,
      status: "waiting_for_pro",
      pairingStage: "waiting_for_pro",
      pairingDeadline: new Date(endsAt).toISOString(),
      broadcastOffer: true,
    });
  }
  return out;
}

/**
 * Could this pro have seen this job at some point (online, in range, right trade)?
 * Used only to give a pro who just lost the race an honest "already taken"
 * instead of "Forbidden"; a pro who never could have seen it still gets 403.
 */
export async function proCouldHaveSeenJob(jobId: string, proId: string): Promise<boolean> {
  const { createServiceSupabase } = await import("@/lib/supabase/server");
  const sb = createServiceSupabase();
  const { data: row } = await sb
    .from("service_requests")
    .select(
      "id, status, pairing_stage, repair_pro_id, status_history, created_at, radius_km, pickup_lat, pickup_lng, service_type, likely_trade_ids, problem_text, description, motorist_id",
    )
    .eq("id", jobId)
    .maybeSingle();
  const job = row as unknown as PoolRow | null;
  if (!job || job.motorist_id === proId) return false;
  const pro = await loadPro(sb, proId);
  if (!pro) return false;
  return proCanSeePoolJob(pro, job, { atElapsedMs: Number.POSITIVE_INFINITY });
}

export type ClaimOutcome =
  | { ok: true; jobId: string; noop?: boolean }
  | { ok: false; error: string; status: number };

/** Atomically claim an open job. First caller wins; everyone else gets a clear 409. */
export async function claimBroadcastOffer(sb: Sb, jobId: string, proId: string): Promise<ClaimOutcome> {
  const { data: row } = await sb
    .from("service_requests")
    .select(
      "id, status, pairing_stage, repair_pro_id, status_history, created_at, radius_km, pickup_lat, pickup_lng, service_type, likely_trade_ids, problem_text, description, motorist_id",
    )
    .eq("id", jobId)
    .maybeSingle();
  const job = row as unknown as PoolRow | null;
  if (!job) return { ok: false, error: "Job not found", status: 404 };
  if (job.repair_pro_id && job.repair_pro_id !== proId) {
    return { ok: false, error: "Another pro has already taken this request", status: 409 };
  }
  if (job.motorist_id === proId) return { ok: false, error: "You cannot take your own request", status: 403 };

  if (!job.repair_pro_id) {
    if (!isOpenPoolRow(job)) {
      return { ok: false, error: "Request is not open for this action", status: 409 };
    }
    const pro = await loadPro(sb, proId);
    if (!pro || !(await proCanSeePoolJob(pro, job))) {
      return { ok: false, error: "This request is not available to you", status: 403 };
    }
  }

  const { data: prof } = await sb
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", proId)
    .maybeSingle();
  const proRow = await loadPro(sb, proId);
  const { data, error } = await sb.rpc("claim_broadcast_offer", {
    p_request_id: jobId,
    p_pro_id: proId,
    p_pro_name: prof?.full_name || proRow?.business_name || "Repair Pro",
    p_pro_photo: prof?.avatar_url || null,
    p_window_ms: BROADCAST_WINDOW_MS,
  });
  if (error) return { ok: false, error: "Could not take this request. Please try again.", status: 503 };
  if (data === "claimed") return { ok: true, jobId };
  if (data === "noop") return { ok: true, jobId, noop: true };
  if (data === "taken") return { ok: false, error: "Another pro has already taken this request", status: 409 };
  if (data === "closed") return { ok: false, error: "Request is not open for this action", status: 409 };
  if (data === "excluded") return { ok: false, error: "This request is no longer available to you", status: 403 };
  if (data === "not_found") return { ok: false, error: "Job not found", status: 404 };
  return { ok: false, error: "Could not take this request. Please try again.", status: 503 };
}

/** Pro dismissed (Decline) or postponed (Later) an open job they never claimed.
 * Only that pro's view changes; the job stays in the pool for everyone else. */
export async function recordPoolResponse(
  sb: Sb,
  jobId: string,
  proId: string,
  status: "declined" | "deferred",
  note?: string | null,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { error } = await sb.from("request_pairing_queue").upsert(
    {
      request_id: jobId,
      pro_id: proId,
      position: 0,
      source: "broadcast",
      status,
      responded_at: new Date().toISOString(),
      result_note: note || null,
    },
    { onConflict: "request_id,pro_id" },
  );
  if (error) return { ok: false, error: "Could not record your response", status: 500 };
  return { ok: true };
}

/**
 * Pros who could ever be ALERTED about this job (any tier, not excluded): online
 * with a fresh pin, or online with an older pin (app closed) AND a push
 * subscription so the alert can actually reach them.
 */
async function eligiblePros(sb: Sb, row: PoolRow): Promise<BroadcastPro[]> {
  const { data } = await sb
    .from("repair_pro_profiles")
    .select(PRO_COLUMNS)
    .eq("is_online", true)
    .neq("status", "suspended")
    .neq("status", "rejected");
  const pros = (data ?? []) as unknown as BroadcastPro[];
  const { data: queue } = await sb
    .from("request_pairing_queue")
    .select("pro_id, status")
    .eq("request_id", row.id);
  const tried = new Map((queue ?? []).map((q) => [String(q.pro_id), String(q.status)]));
  const trades = await dispatchTradesFor(row);
  const now = Date.now();
  const stale = pros.filter((p) => !hasRecentLiveHeartbeat(p.location_updated_at, now));
  const pushable = new Set<string>();
  if (stale.length) {
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("user_id")
      .in("user_id", stale.map((p) => p.user_id));
    for (const s of subs ?? []) pushable.add(String(s.user_id));
  }
  const out: BroadcastPro[] = [];
  for (const p of pros) {
    const st = tried.get(String(p.user_id));
    if (st && EXCLUDED_QUEUE.has(st)) continue;
    if (p.user_id === row.motorist_id) continue;
    // App closed: only worth alerting if a push can actually be delivered.
    if (!hasRecentLiveHeartbeat(p.location_updated_at, now) && !pushable.has(String(p.user_id))) continue;
    if (
      await proCanSeePoolJob(p, row, {
        nowMs: now,
        atElapsedMs: Number.POSITIVE_INFINITY,
        trades,
        alertOnly: true,
      })
    ) {
      out.push(p);
    }
  }
  return out;
}

/** How many pros could ever claim this job (ignoring tier timing). */
export async function countReachablePros(sb: Sb, row: PoolRow): Promise<number> {
  return (await eligiblePros(sb, row)).length;
}

/**
 * Push the job to pros whose tier has just opened and who have not been told
 * yet. A 'pending' queue row is the "already notified" marker (and the claim
 * RPC accepts a pending row), so repeated sweeps never spam.
 */
export async function notifyOpenTiers(sb: Sb, row: PoolRow, max = 25): Promise<number> {
  if (!isOpenPoolRow(row)) return 0;
  const now = Date.now();
  const { startedAt } = broadcastWindow(row);
  const pros = await eligiblePros(sb, row);
  const { data: queue } = await sb.from("request_pairing_queue").select("pro_id").eq("request_id", row.id);
  const known = new Set((queue ?? []).map((q) => String(q.pro_id)));
  const trades = await dispatchTradesFor(row);
  const due: BroadcastPro[] = [];
  for (const p of pros) {
    if (known.has(String(p.user_id))) continue;
    if (await proCanSeePoolJob(p, row, { nowMs: now, atElapsedMs: now - startedAt, trades, alertOnly: true })) due.push(p);
    if (due.length >= max) break;
  }
  if (!due.length) return 0;
  const stamp = new Date().toISOString();
  const { error } = await sb.from("request_pairing_queue").upsert(
    due.map((p) => ({
      request_id: row.id,
      pro_id: p.user_id,
      position: 0,
      source: "broadcast",
      status: "pending",
      offered_at: stamp,
    })),
    { onConflict: "request_id,pro_id", ignoreDuplicates: true },
  );
  if (error) return 0;
  try {
    const { insertNotification } = await import("@/lib/server/notifications");
    await Promise.all(
      due.map((p) =>
        insertNotification({
          userId: p.user_id,
          category: "requests",
          priority: "high",
          title: "Service Request",
          body: `New request from ${row.motorist_name || "a customer"} · ${String(row.problem_text || row.description || "").slice(0, 80)}`,
          href: `/jobs/${row.id}`,
          actionType: "open_job",
          actionPayload: { jobId: row.id },
          jobId: row.id,
          jobStatus: "waiting_for_pro",
          groupKey: `service-request-${row.id}`,
          pushUrgent: true,
        }).catch(() => undefined),
      ),
    );
  } catch {
    /* notifications optional */
  }
  return due.length;
}
