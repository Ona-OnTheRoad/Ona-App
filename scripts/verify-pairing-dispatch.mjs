/** Run against a NEW disposable local database; never reads application env. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { verifyPairingOpen } from "./verify-pairing-open-fixture.mjs";

const connectionString = process.env.PAIRING_TEST_DATABASE_URL;
if (!connectionString) throw new Error("Set PAIRING_TEST_DATABASE_URL to a fresh disposable local database");
const url = new URL(connectionString);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Fixture must be local");
const pool = new pg.Pool({ connectionString, max: 8 });
const pro = randomUUID();
const other = randomUUID();
const signature = "public.dispatch_pairing_offer(uuid,bigint,text,uuid,text,text,integer)";
try {
  assert.equal((await pool.query("select to_regclass('public.service_requests') as jobs")).rows[0].jobs, null,
    "Refuse any database containing existing job data");
  await pool.query(`do $$ begin
    if not exists (select from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists (select from pg_roles where rolname='service_role') then create role service_role; end if;
  end $$;
  create table public.profiles(id uuid primary key);
  create table public.service_requests(id uuid primary key, flow_status text, status text,
    pairing_stage text, pairing_deadline timestamptz, repair_pro_id uuid references public.profiles(id),
    repair_pro_name text, repair_pro_photo text, reservation_status text, assignment_status text,
    queue_position integer, remaining_candidates integer, updated_at timestamptz, status_history jsonb,
    likely_trade_ids text[], idempotency_key text, negotiate_ends_at timestamptz);`);
  const sspe = await readFile(new URL("../supabase/migrations/20260804_047_sspe.sql", import.meta.url), "utf8");
  await pool.query(sspe.slice(sspe.indexOf("create table if not exists public.request_reservations"), sspe.indexOf("-- 4.3 request_pairing_queue")));
  await pool.query(sspe.slice(sspe.indexOf("create table if not exists public.request_pairing_queue"), sspe.indexOf("-- 4.4 merit_scores")));
  await pool.query(await readFile(new URL("../supabase/migrations/20261007_079_job_version_cas.sql", import.meta.url), "utf8"));
  const migration = await readFile(new URL("../supabase/migrations/20261018_081_atomic_pairing_dispatch.sql", import.meta.url), "utf8");
  await pool.query(migration);
  await pool.query(migration);
  await pool.query("insert into public.profiles(id) values ($1),($2)", [pro, other]);
  async function seed() {
    const id = randomUUID();
    await pool.query(`insert into public.service_requests(id,flow_status,status,pairing_stage,
      reservation_status,assignment_status,queue_position,status_history)
      values ($1,'sequential_pairing','requested','sequential_pairing','none','none',0,
      '[{"status":"sequential_pairing","by":"motorist"}]')`, [id]);
    return id;
  }
  const call = async (id, version = 0, candidate = pro, client = pool) =>
    (await client.query("select public.dispatch_pairing_offer($1,$2,'sequential_pairing',$3,'Pro',null,0) as result", [id, version, candidate])).rows[0].result;
  const state = async (id) => (await pool.query(`select repair_pro_id,pairing_stage,flow_status,job_version::int,
    queue_position,pairing_deadline,status_history,likely_trade_ids,
    (select count(*)::int from public.request_pairing_queue q where q.request_id=r.id) as offers
    from public.service_requests r where id=$1`, [id])).rows[0];

  const concurrent = await seed();
  const wins = await Promise.all([call(concurrent), call(concurrent, 0, other)]);
  assert.equal(wins.filter((v) => v === "dispatched").length, 1);
  const winner = await state(concurrent);
  assert.equal(winner.offers, 1);
  assert.equal(winner.queue_position, 1);
  assert.equal(winner.job_version, 1);
  assert.equal(winner.pairing_stage, "waiting_for_pro");
  assert.equal(winner.flow_status, "waiting_for_pro");
  assert.equal(winner.pairing_deadline, null, "Only surface/fallback arms the 144s timer");
  assert.equal(winner.status_history.length, 2, "Preserve existing history and append one dispatch");
  const offered = (await pool.query("select pro_id from public.request_pairing_queue where request_id=$1", [concurrent])).rows[0];
  assert.equal(winner.repair_pro_id, offered.pro_id);
  assert.equal(await call(concurrent), "noop", "Duplicate must not notify/offer twice");

  for (const race of ["classification", "cancelled", "negotiating"]) {
    const id = await seed();
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select id from public.service_requests where id=$1 for update", [id]);
      const dispatch = call(id);
      if (race === "classification") {
        await client.query("update public.service_requests set likely_trade_ids=array['mechanic'] where id=$1", [id]);
      } else {
        await client.query("update public.service_requests set pairing_stage=null,flow_status=$2,status=$2 where id=$1", [id, race]);
      }
      await client.query("commit");
      assert.equal(await dispatch, race === "classification" ? "conflict" : "noop");
      assert.equal((await state(id)).offers, 0, "Losing dispatch leaves no queue offer");
      if (race === "classification") {
        assert.equal(await call(id, 1), "dispatched", "Reloaded version can retry");
        assert.deepEqual((await state(id)).likely_trade_ids, ["mechanic"]);
      } else {
        assert.equal((await state(id)).flow_status, race, "Never overwrite the state winner");
      }
    } finally { await client.query("rollback"); client.release(); }
  }

  // Failure after queue insertion must roll back the offer as well as the job.
  const failed = await seed();
  await pool.query(`create function fixture_dispatch_fail() returns trigger language plpgsql as $$
    begin raise exception 'injected assignment failure'; end $$;
    create trigger fixture_dispatch_fail before update on public.service_requests
    for each row execute function fixture_dispatch_fail();`);
  await assert.rejects(call(failed), /injected assignment failure/);
  assert.equal((await state(failed)).offers, 0);
  assert.equal((await state(failed)).repair_pro_id, null);
  assert.equal((await state(failed)).job_version, 0);
  await pool.query("drop trigger fixture_dispatch_fail on public.service_requests");
  assert.equal(await call(failed), "dispatched");

  const invalid = await seed();
  await assert.rejects(call(invalid, 0, randomUUID()), /foreign key/);
  assert.equal((await state(invalid)).offers, 0);
  assert.equal((await state(invalid)).job_version, 0);

  for (const status of ["offered", "opened", "accepted", "declined", "timed_out", "deferred", "skipped"]) {
    const id = await seed();
    await pool.query("insert into public.request_pairing_queue(request_id,pro_id,position,source,status) values ($1,$2,1,'pairing',$3)", [id, pro, status]);
    assert.equal(await call(id), "conflict", "Previously contacted pro must not be reoffered: " + status);
    assert.equal((await state(id)).repair_pro_id, null);
    assert.equal((await state(id)).job_version, 0);
    assert.equal((await pool.query("select status from public.request_pairing_queue where request_id=$1", [id])).rows[0].status, status);
  }
  const capped = await seed();
  await pool.query("update public.service_requests set queue_position=6 where id=$1", [capped]);
  assert.equal(await call(capped, 1), "noop");
  assert.equal((await state(capped)).offers, 0);

  for (const role of ["anon", "authenticated", "service_role"]) {
    const client = await pool.connect();
    try {
      await client.query(`set role ${role}`);
      if (role === "service_role") {
        assert.equal(await call(await seed(), 0, pro, client), "dispatched");
      } else {
        await assert.rejects(call(randomUUID(), 0, pro, client), /permission denied/);
      }
    } finally { await client.query("reset role"); client.release(); }
  }
  const perms = (await pool.query("select has_function_privilege('anon',$1,'execute') as anon, has_function_privilege('authenticated',$1,'execute') as authenticated, has_function_privilege('service_role',$1,'execute') as service", [signature])).rows[0];
  assert.deepEqual(perms, { anon: false, authenticated: false, service: true });
  await verifyPairingOpen(pool, pro, other);
  console.log("Atomic dispatch passed: concurrent/duplicate dispatch, classification retry, cancellation/negotiation winners, rollback/retry, foreign keys, contacted-pro exclusions, six-pro cap, service-role permissions and migration reapplication.");
} finally { await pool.end(); }
