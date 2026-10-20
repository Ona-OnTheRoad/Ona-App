/** Atomic Open checks on the disposable pairing fixture; no app environment. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function verifyPairingOpen(pool, pro, other) {
  const migration = await readFile(new URL("../supabase/migrations/20261019_082_atomic_pairing_open.sql", import.meta.url), "utf8");
  await pool.query(migration);
  await pool.query(migration);
  async function seed(stage = "waiting_for_pro", deadline = new Date(Date.now() + 90_000).toISOString()) {
    const id = randomUUID();
    await pool.query(`insert into public.service_requests(id,flow_status,status,pairing_stage,
      repair_pro_id,reservation_status,assignment_status,pairing_deadline,status_history)
      values ($1,$2,'requested',$2,$3,'none','none',$4,'[]')`, [id, stage, pro, deadline]);
    return id;
  }
  const open = async (id, key = "open-key", actor = pro, client = pool) =>
    (await client.query("select public.open_pairing_request($1,$2,$3,144000,10000) as result", [id, actor, key])).rows[0].result;
  const state = async (id) => (await pool.query(`select pairing_stage,flow_status,job_version::int,
    pairing_deadline::text as deadline,status_history,likely_trade_ids,
    (select count(*)::int from public.request_reservations v where v.request_id=r.id and v.status='active') as active
    from public.service_requests r where id=$1`, [id])).rows[0];
  const concurrent = await seed();
  const original = await state(concurrent);
  const results = await Promise.all([open(concurrent), open(concurrent, "other-key")]);
  assert.equal(results.filter((v) => v === "opened").length, 1);
  assert.equal(results.filter((v) => v === "noop").length, 1);
  const winner = await state(concurrent);
  assert.equal(winner.active, 1);
  assert.equal(winner.job_version, 1);
  assert.equal(winner.deadline, original.deadline, "Healthy response window is preserved");
  assert.equal(winner.pairing_stage, "reserved");
  assert.equal(winner.status_history.length, 1);
  await pool.query("update public.service_requests set pairing_deadline=clock_timestamp()+interval '3 seconds' where id=$1", [concurrent]);
  const beforeReplay = await state(concurrent);
  assert.equal(await open(concurrent, "retry-key"), "noop");
  assert.deepEqual(await state(concurrent), beforeReplay, "Replay cannot reset timer/history/version");

  const selected = await seed("waiting_for_selected");
  assert.equal(await open(selected), "opened");
  assert.equal((await state(selected)).pairing_stage, "selected_review");
  for (const deadline of [null, new Date(Date.now() + 5_000).toISOString()]) {
    const id = await seed("waiting_for_pro", deadline);
    assert.equal(await open(id), "opened");
    const remaining = Date.parse((await state(id)).deadline) - Date.now();
    assert(remaining > 143_000 && remaining <= 144_000, "Only first Open rearms missing/nearly-spent deadline to 144s");
  }

  for (const race of ["classification_surface", "cancelled", "reassigned"]) {
    const id = await seed();
    const client = await pool.connect();
    let expectedDeadline;
    try {
      await client.query("begin");
      await client.query("select id from public.service_requests where id=$1 for update", [id]);
      const pending = open(id);
      if (race === "classification_surface") {
        await client.query("update public.service_requests set likely_trade_ids=array['mechanic'],pairing_deadline=clock_timestamp()+interval '100 seconds' where id=$1", [id]);
        expectedDeadline = (await client.query("select pairing_deadline::text as deadline from public.service_requests where id=$1", [id])).rows[0].deadline;
      } else if (race === "cancelled") {
        await client.query("update public.service_requests set pairing_stage=null,flow_status='cancelled',status='cancelled' where id=$1", [id]);
      } else {
        await client.query("update public.service_requests set repair_pro_id=$2 where id=$1", [id, other]);
      }
      await client.query("commit");
      assert.equal(await pending, race === "classification_surface" ? "opened" : race === "cancelled" ? "closed" : "forbidden");
      const current = await state(id);
      assert.equal(current.active, race === "classification_surface" ? 1 : 0);
      if (race === "classification_surface") {
        assert.equal(current.deadline, expectedDeadline);
        assert.deepEqual(current.likely_trade_ids, ["mechanic"]);
      }
    } finally { await client.query("rollback"); client.release(); }
  }

  const failed = await seed();
  await pool.query(`create function fixture_open_fail() returns trigger language plpgsql as $$
    begin raise exception 'injected Open assignment failure'; end $$;
    create trigger fixture_open_fail before update on public.service_requests
    for each row execute function fixture_open_fail();`);
  await assert.rejects(open(failed), /injected Open assignment failure/);
  assert.equal((await state(failed)).active, 0, "Failed job update rolls back reservation insertion");
  assert.equal((await state(failed)).pairing_stage, "waiting_for_pro");
  assert.equal((await state(failed)).job_version, 0);
  await pool.query("drop trigger fixture_open_fail on public.service_requests");
  assert.equal(await open(failed), "opened");

  for (const owner of [pro, other]) {
    const id = await seed();
    await pool.query("insert into public.request_reservations(request_id,pro_id,stage,status,expires_at) values($1,$2,'reserved','active',clock_timestamp()+interval '90 seconds')", [id, owner]);
    assert.equal(await open(id), owner === pro ? "opened" : "reservation_conflict");
    assert.equal((await state(id)).active, 1, "Never duplicate or cancel another holder's reservation");
  }
  const confirmed = await seed();
  await pool.query("update public.service_requests set pairing_stage=null,flow_status='negotiating',reservation_status='confirmed',assignment_status='assigned',negotiate_ends_at=clock_timestamp()+interval '20 minutes' where id=$1", [confirmed]);
  const before = await state(confirmed);
  assert.equal(await open(confirmed), "noop");
  assert.deepEqual(await state(confirmed), before);
  const missing = await seed("reserved");
  assert.equal(await open(missing), "reservation_conflict", "Do not pretend a missing active review is ready");

  for (const role of ["anon", "authenticated", "service_role"]) {
    const client = await pool.connect();
    try {
      await client.query(`set role ${role}`);
      if (role === "service_role") assert.equal(await open(await seed(), "key", pro, client), "opened");
      else await assert.rejects(open(randomUUID(), "key", pro, client), /permission denied/);
    } finally { await client.query("reset role"); client.release(); }
  }
  assert.equal(await open(randomUUID()), "not_found");
  console.log("Atomic Open passed: concurrent/replayed opens, classification/surface/cancellation/ownership races, rollback/retry, timer preservation, legacy own-reservation reuse and role permissions.");
}
