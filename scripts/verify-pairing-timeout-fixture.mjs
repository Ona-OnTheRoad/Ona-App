/** Additional atomic timeout regression checks on the disposable lease fixture. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

export async function verifyPairingTimeout(pool) {
  const pro = randomUUID();
  const otherPro = randomUUID();
  async function seed(origin = pro) {
    const id = randomUUID();
    const deadline = new Date(Date.now() - 5000).toISOString();
    const updated = new Date(Date.now() - 10000).toISOString();
    await pool.query(`insert into public.service_requests(id, flow_status, status, pairing_stage,
      pairing_deadline, repair_pro_id, updated_at, reservation_status, status_history)
      values ($1, 'waiting_for_pro', 'requested', 'waiting_for_pro', $2, $3, $4, 'active', '[]')`, [id, deadline, pro, updated]);
    await pool.query("insert into public.request_pairing_queue(request_id, pro_id, status) values ($1,$2,'offered')", [id, pro]);
    await pool.query("insert into public.request_reservations(request_id, pro_id, status, expires_at) values ($1,$2,'active',$3)", [id, pro, deadline]);
    await pool.query("insert into public.service_request_callouts(request_id, origin_pro_id, callout_status, callout_fee) values ($1,$2,'LOCKED',100)", [id, origin]);
    return { id, deadline, updated };
  }
  const timeout = async (job) => (await pool.query(`select public.timeout_pairing_request(
    $1, 'waiting_for_pro', $2, $3, $4, 4000) as won`, [job.id, job.deadline, pro, job.updated])).rows[0].won;
  async function states(job) {
    return (await pool.query(`select r.pairing_stage, r.flow_status, q.status as queue,
      c.callout_status as quote, c.callout_fee, v.status as reservation,
      (select count(*)::int from public.callout_fee_events e where e.request_id = r.id) as events
      from public.service_requests r join public.request_pairing_queue q on q.request_id = r.id
      join public.service_request_callouts c on c.request_id = r.id
      join public.request_reservations v on v.request_id = r.id where r.id = $1`, [job.id])).rows[0];
  }
  const concurrent = await seed();
  const wins = await Promise.all([timeout(concurrent), timeout(concurrent)]);
  assert.equal(wins.filter(Boolean).length, 1);
  assert.deepEqual(await states(concurrent), { pairing_stage: "sequential_pairing", flow_status: "sequential_pairing",
    queue: "timed_out", quote: "CANCELLED", callout_fee: "100", reservation: "cancelled", events: 1 });
  assert.equal(await timeout(concurrent), false, "Duplicate cannot settle twice");

  for (const race of ["rearm", "confirm"]) {
    const job = await seed();
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select id from public.service_requests where id = $1 for update", [job.id]);
      const staleTimeout = timeout(job); // Stale observed snapshot, blocked behind the client winner.
      if (race === "rearm") {
        await client.query("update public.service_requests set pairing_deadline = clock_timestamp()+interval '144 seconds', updated_at=clock_timestamp() where id=$1", [job.id]);
      } else {
        await client.query("update public.service_requests set pairing_stage=null, flow_status='negotiating', pairing_deadline=null, reservation_status='confirmed', updated_at=clock_timestamp() where id=$1", [job.id]);
        await client.query("update public.request_pairing_queue set status='accepted' where request_id=$1", [job.id]);
        await client.query("update public.request_reservations set status='confirmed' where request_id=$1", [job.id]);
      }
      await client.query("commit");
      assert.equal(await staleTimeout, false, `${race} winner is not undone`);
      const current = await states(job);
      assert.equal(current.quote, "LOCKED");
      assert.equal(current.events, 0);
      assert.equal(current.queue, race === "rearm" ? "offered" : "accepted");
    } finally { await client.query("rollback"); client.release(); }
  }
  const partialOpen = await seed();
  await pool.query("update public.request_reservations set expires_at=clock_timestamp()+interval '144 seconds' where request_id=$1", [partialOpen.id]);
  assert.equal(await timeout(partialOpen), true);
  assert.equal((await states(partialOpen)).reservation, "cancelled", "Winning timeout frees a racing partial-open slot");
  const otherQuote = await seed(otherPro);
  assert.equal(await timeout(otherQuote), true);
  assert.equal((await states(otherQuote)).quote, "LOCKED", "Never void another pro's quote");
  const unknownQuote = await seed(null);
  assert.equal(await timeout(unknownQuote), true);
  assert.equal((await states(unknownQuote)).quote, "LOCKED", "Never void unknown quote ownership");

  const failed = await seed();
  await pool.query("update public.request_pairing_queue set result_note='force_failure' where request_id=$1", [failed.id]);
  await pool.query(`create function fixture_fail_settlement() returns trigger language plpgsql as $$
    begin if old.result_note='force_failure' then raise exception 'injected settlement failure'; end if; return new; end $$;
    create trigger fixture_settlement_failure before update on public.request_pairing_queue
      for each row execute function fixture_fail_settlement();`);
  await assert.rejects(timeout(failed), /injected settlement failure/);
  assert.deepEqual(await states(failed), { pairing_stage: "waiting_for_pro", flow_status: "waiting_for_pro",
    queue: "offered", quote: "LOCKED", callout_fee: "100", reservation: "active", events: 0 }, "Failure rolls back every effect");
  await pool.query("drop trigger fixture_settlement_failure on public.request_pairing_queue");
  assert.equal(await timeout(failed), true, "Rolled-back timeout can retry");

  for (const role of ["anon", "authenticated"]) {
    const client = await pool.connect();
    try {
      await client.query(`set role ${role}`);
      await assert.rejects(client.query("select public.timeout_pairing_request($1,'waiting_for_pro',$2,$3,$4,4000)",
        [randomUUID(), failed.deadline, pro, failed.updated]), /permission denied/);
    } finally { await client.query("reset role"); client.release(); }
  }
  console.log("Atomic timeout passed: concurrent/duplicate attempts, blocked rearm/confirm races, quote ownership, rollback/retry, and permissions.");
}
