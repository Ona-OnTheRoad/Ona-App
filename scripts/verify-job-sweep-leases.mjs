/** Run only against a fresh disposable local PostgreSQL database. Never uses application env. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { verifyPairingTimeout } from "./verify-pairing-timeout-fixture.mjs";

const connectionString = process.env.SWEEP_TEST_DATABASE_URL;
if (!connectionString) throw new Error("Set SWEEP_TEST_DATABASE_URL to a fresh disposable local database");
const url = new URL(connectionString);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Fixture must be local");
const pool = new pg.Pool({ connectionString, max: 8 });
try {
  const { rows: existing } = await pool.query("select to_regclass('public.service_requests') as jobs, to_regclass('public.job_sweep_leases') as leases");
  assert.equal(existing[0].jobs, null, "Fixture must have no existing service_requests table");
  assert.equal(existing[0].leases, null, "Fixture must have no existing leases");
  await pool.query(`do $$ begin
    if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
  end $$;
  create table public.service_requests(id uuid primary key, flow_status text, status text,
    negotiate_ends_at timestamptz, updated_at timestamptz, pairing_stage text, pairing_deadline timestamptz,
    repair_pro_id uuid, repair_pro_name text, reservation_status text, status_history jsonb);
  create table public.request_pairing_queue(request_id uuid references public.service_requests(id),
    pro_id uuid, status text, responded_at timestamptz, result_note text, primary key(request_id, pro_id));
  create table public.request_reservations(request_id uuid references public.service_requests(id),
    pro_id uuid, status text, expires_at timestamptz, released_at timestamptz, released_by text);
  create table public.service_request_callouts(request_id uuid primary key references public.service_requests(id),
    origin_pro_id uuid, callout_status text, voided_at timestamptz, void_reason text,
    lock_idempotency_key text, updated_at timestamptz, approved_route_distance_km numeric,
    billable_distance_km numeric, callout_fee numeric);
  create table public.callout_fee_events(request_id uuid references public.service_requests(id), pro_id uuid,
    event text, approved_route_distance_km numeric, billable_distance_km numeric, callout_fee numeric, payload jsonb);`);
  const migration = await readFile(new URL("../supabase/migrations/20261007_078_job_sweep_leases.sql", import.meta.url), "utf8");
  await pool.query(migration);
  await pool.query(migration); // Reapplying preserves safety and is idempotent.
  const owners = Array.from({ length: 8 }, () => randomUUID());
  const claims = await Promise.all(owners.map((owner) => pool.query("select public.claim_job_sweep_lease('pairing', $1) as claimed", [owner])));
  assert.equal(claims.filter((result) => result.rows[0].claimed).length, 1, "Exactly one concurrent claimant");
  const winner = owners[claims.findIndex((result) => result.rows[0].claimed)];
  const next = randomUUID();
  await pool.query("select public.release_job_sweep_lease('pairing', $1)", [next]);
  assert.equal((await pool.query("select count(*)::int as n from public.job_sweep_leases")).rows[0].n, 1, "Wrong owner cannot release");
  assert.equal((await pool.query("select public.claim_job_sweep_lease('negotiation', $1) as claimed", [next])).rows[0].claimed, true, "Scopes independent");
  await pool.query("update public.job_sweep_leases set expires_at = clock_timestamp() - interval '1 second' where scope = 'pairing'");
  assert.equal((await pool.query("select public.claim_job_sweep_lease('pairing', $1) as claimed", [next])).rows[0].claimed, true, "Crash expiry allows recovery");
  await pool.query("select public.release_job_sweep_lease('pairing', $1)", [winner]);
  assert.equal((await pool.query("select owner from public.job_sweep_leases where scope = 'pairing'")).rows[0].owner, next, "Stale owner cannot release new lease");
  await pool.query("select public.release_job_sweep_lease('pairing', $1)", [next]);
  assert.equal((await pool.query("select count(*)::int as n from public.job_sweep_leases where scope = 'pairing'")).rows[0].n, 0);
  for (const role of ["anon", "authenticated"]) {
    const client = await pool.connect();
    try {
      await client.query(`set role ${role}`);
      await assert.rejects(client.query("select public.claim_job_sweep_lease('pairing', $1)", [randomUUID()]), /permission denied/);
      await assert.rejects(client.query("select * from public.job_sweep_leases"), /permission denied/);
    } finally { await client.query("reset role"); client.release(); }
  }
  const client = await pool.connect();
  try {
    await client.query("set role service_role");
    assert.equal((await client.query("select public.claim_job_sweep_lease('pairing', $1) as claimed", [randomUUID()])).rows[0].claimed, true);
  } finally { await client.query("reset role"); client.release(); }
  await verifyPairingTimeout(pool);
  console.log("Lease migration passed: concurrent claims, owner isolation, expiry recovery, permissions, and reapplication.");
} finally { await pool.end(); }
