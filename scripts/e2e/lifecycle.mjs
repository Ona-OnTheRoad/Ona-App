#!/usr/bin/env node
/**
 * End-to-end test of the marketplace lifecycle through the REAL HTTP API:
 *
 *   customer creates a job -> dispatch to the nearest Repair Pro -> Open / Confirm
 *   -> negotiation (offers) -> agreed -> escrow payment -> trip -> arrived -> work
 *   -> completed -> customer satisfied -> release / payout -> rating -> chat
 *   plus: decline and re-route, cancel before and after payment (refund), dispute,
 *   authorization and validation negatives at every step.
 *
 * WARNING: this WRITES to whatever Supabase project .env.local points at (it uses the
 * service role to create test users). It talks only to a LOCAL Next server, which must be
 * started with every paid/outbound channel blanked and PAYMENT_PROVIDER=mock
 * (see scripts/e2e/README.md). Everything it creates is tagged so it can be removed:
 *   email  ...@ona-e2e.invalid   (reserved TLD, can never receive mail)
 *   name   "E2E-TEST ..."
 * Cleanup:  node scripts/e2e/cleanup.mjs
 *
 * Geographic isolation: all test users sit at coordinates in the open ocean, so no real
 * customer or Repair Pro can be within the 5 km matching radius of a test job.
 *
 * Usage:  E2E_CONFIRM_WRITES=yes BASE_URL=http://localhost:3201 node scripts/e2e/lifecycle.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: resolve(root, ".env.local") });

// ───────────────────────── guard rails ─────────────────────────
const BASE = (process.env.BASE_URL || "http://localhost:3201").replace(/\/$/, "");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (process.env.E2E_CONFIRM_WRITES !== "yes") {
  console.error("Refusing to run: set E2E_CONFIRM_WRITES=yes (this writes test data to the configured Supabase project).");
  process.exit(2);
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error(`Refusing to run: BASE_URL must be a local server, got ${BASE}`);
  process.exit(2);
}
if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase URL / service role / anon key in .env.local");
  process.exit(2);
}

const RUN = Date.now().toString(36);
const PASSWORD = `E2e-${RUN}-Pass!9`;
const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const projectHost = new URL(url).host;

// Open ocean (Gulf of Guinea): no real user can be within 5 km.
const SITE = { lat: 0.01, lng: 0.01, label: "E2E test site (open ocean)" };
const P1_AT = { lat: 0.0105, lng: 0.0105 };
const P2_AT = { lat: 0.016, lng: 0.016 };

// ───────────────────────── tiny test framework ─────────────────────────
const results = [];
let section = "";
const C = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, d: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };
function head(name) { section = name; console.log(`\n${C.b(name)}`); }
function check(name, cond, detail = "") {
  const pass = Boolean(cond);
  results.push({ section, name, pass, detail: String(detail ?? "") });
  console.log(`  ${pass ? C.g("PASS") : C.r("FAIL")} ${name}${detail && !pass ? C.d("  -> " + detail) : detail ? C.d("  (" + detail + ")") : ""}`);
  return pass;
}
function note(msg) { console.log(`  ${C.y("NOTE")} ${msg}`); results.push({ section, name: msg, pass: null, detail: "note" }); }
class Abort extends Error {}
function abort(msg) { throw new Abort(msg); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, { timeout = 25000, every = 700 } = {}) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) { last = await fn(); if (last) return last; await sleep(every); }
  return null;
}
const short = (o) => JSON.stringify(o)?.slice(0, 220);

// ───────────────────────── http + data helpers ─────────────────────────
async function api(token, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-json */ }
  return { status: res.status, ok: res.ok && json?.ok !== false, json, data: json?.data, err: json?.error };
}
const errMsg = (r) => `${r.status} ${r.err?.code || ""} ${r.err?.message || short(r.json)}`.trim();

const created = { users: [], jobs: new Set() };

async function makeUser(kind, extra = {}) {
  const email = `e2e.${kind}.${RUN}.${created.users.length}@ona-e2e.invalid`;
  const phone = `+2340${String(Math.floor(100000000 + Math.random() * 899999999))}`;
  const fullName = `E2E-TEST ${kind} ${RUN}`;
  const { data, error } = await sb.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: fullName, role: kind === "customer" ? "motorist" : "repair_pro", e2e: true, e2e_run: RUN },
  });
  if (error) abort(`createUser failed: ${error.message}`);
  const id = data.user.id;
  const role = kind === "customer" ? "motorist" : "repair_pro";
  const prof = await sb.from("profiles").upsert({
    id, role, full_name: fullName, email, phone, city: "E2E", area: "Ocean", gender: "male",
    date_of_birth: "1990-01-15", is_active: true, updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (prof.error) abort(`profiles upsert failed: ${prof.error.message}`);
  if (role === "motorist") {
    const m = await sb.from("motorist_profiles").upsert({ user_id: id, vehicle_make: "Toyota", vehicle_model: "Corolla", vehicle_year: "2019", plate_number: `E2E-${RUN}`.slice(0, 12) }, { onConflict: "user_id" });
    if (m.error) abort(`motorist_profiles upsert failed: ${m.error.message}`);
  } else {
    const bankNo = `9${String(Math.floor(10000000 + Math.random() * 89999999))}0`;
    const row = {
      user_id: id, primary_service: "mechanic", services: ["mechanic"],
      business_name: `E2E-TEST Mechanic ${RUN}`, bio: "E2E test professional", years_experience: "5",
      service_radius_km: 5, lat: extra.lat, lng: extra.lng, is_online: true,
      verified: true, status: "approved", visibility_tier: 2, rating_avg: 4.5, phone_verified: true,
      location_updated_at: new Date().toISOString(),
      bank_name: "E2E Bank", bank_account_name: fullName, bank_account_number: bankNo, bank_code: "058",
    };
    const p = await sb.from("repair_pro_profiles").upsert(row, { onConflict: "user_id" });
    if (p.error) abort(`repair_pro_profiles upsert failed: ${p.error.message}`);
  }
  const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: sess, error: sErr } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (sErr || !sess.session) abort(`sign-in failed for ${email}: ${sErr?.message}`);
  const u = { id, email, phone, fullName, token: sess.session.access_token, kind };
  created.users.push({ id, email, kind });
  return u;
}

async function setPro(user, patch) {
  const { error } = await sb.from("repair_pro_profiles").update({ ...patch, location_updated_at: new Date().toISOString() }).eq("user_id", user.id);
  if (error) abort(`setPro failed: ${error.message}`);
}
async function getJob(user, id) { return api(user.token, "GET", `/api/jobs/${id}`); }
async function jobStatus(user, id) { const r = await getJob(user, id); return r.data?.job?.status || r.data?.status || null; }
async function dbJob(id) { const { data } = await sb.from("service_requests").select("*").eq("id", id).maybeSingle(); return data; }
async function dbEscrow(jobId) { const { data } = await sb.from("payments").select("*").eq("request_id", jobId); return data || []; }
const transition = (u, jobId, event, extra = {}) =>
  api(u.token, "POST", `/api/jobs/${jobId}/transition`, { event, actor: u.kind === "customer" ? "motorist" : "repair_pro", ...extra });
const gps = (at) => ({ proLat: at.lat, proLng: at.lng, accuracyM: 12, capturedAt: new Date().toISOString(), mockLocation: false });

async function createJob(c, over = {}) {
  const r = await api(c.token, "POST", "/api/jobs", {
    motoristId: c.id, motoristName: c.fullName, serviceType: "mechanic",
    problem: `E2E flat tyre ${RUN} ${Math.random().toString(36).slice(2, 6)}`, currency: "NGN",
    locationLabel: SITE.label, lat: SITE.lat, lng: SITE.lng, radiusKm: 5,
    clientRequestId: `e2e-${RUN}-${Math.random().toString(36).slice(2, 10)}`, ...over,
  });
  const job = r.data?.job;
  if (job?.id) created.jobs.add(job.id);
  return { r, job };
}

/** Wait until the job is assigned to a Repair Pro (dispatch). */
async function waitDispatched(c, jobId, timeout = 25000) {
  return waitFor(async () => {
    const r = await getJob(c, jobId);
    const j = r.data?.job;
    return j && j.repairProId && j.status !== "sequential_pairing" ? j : null;
  }, { timeout });
}
const pickPro = (j, a, b) => (j.repairProId === a.id ? a : j.repairProId === b.id ? b : null);

async function toNegotiating(c, pro, jobId) {
  const o = await transition(pro, jobId, "OPEN");
  const f = await transition(pro, jobId, "CONFIRM", gps(pro.at));
  return { open: o, confirm: f };
}
async function negotiate(c, pro, jobId, proAsk, custOffer) {
  const a = await api(pro.token, "POST", `/api/jobs/${jobId}/offer`, { action: "place", side: "repair_pro", actorId: pro.id, amountMajor: proAsk });
  const b = await api(c.token, "POST", `/api/jobs/${jobId}/offer`, { action: "place", side: "motorist", actorId: c.id, amountMajor: custOffer });
  const d = await api(pro.token, "POST", `/api/jobs/${jobId}/offer`, { action: "accept", side: "repair_pro", actorId: pro.id });
  return { a, b, d };
}
async function pay(c, jobId) {
  const start = await api(c.token, "POST", `/api/jobs/${jobId}/pay`, { provider: "mock" });
  return start;
}

// ───────────────────────── the run ─────────────────────────
let C1, P1, P2;
async function main() {
  console.log(C.b(`\nOna end-to-end run ${RUN}`));
  console.log(`  server:   ${BASE}`);
  console.log(`  database: ${projectHost}  ${C.y("(REAL project from .env.local)")}`);
  console.log(`  tagging:  *@ona-e2e.invalid, name prefix "E2E-TEST"`);

  head("0. Safeguards and setup");
  const ping = await api(null, "GET", "/api/config");
  check("local server reachable", ping.status === 200, `status ${ping.status}`);
  if (ping.status !== 200) abort("server not reachable");

  // Read-only: PostgREST publishes the list of tables/functions. Nothing is executed.
  const spec = await (await fetch(`${url}/rest/v1/`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: "application/openapi+json" } })).json().catch(() => null);
  const paths = Object.keys(spec?.paths || {});
  const liveFns = new Set(paths.filter((p) => p.startsWith("/rpc/")).map((p) => p.slice(5)));
  const liveTables = new Set(paths.filter((p) => !p.startsWith("/rpc/") && p !== "/").map((p) => p.slice(1)));
  const REQUIRED_FNS = { open_pairing_request: "081/082 migrations", dispatch_pairing_offer: "081 migration", timeout_pairing_request: "078", apply_confirmed_job_payment: "payment confirmation", claim_job_sweep_lease: "078", drain_job_outbox: "outbox", claim_payment_webhook_inbox: "webhooks" };
  for (const [fn, why] of Object.entries(REQUIRED_FNS)) check(`database has SQL function ${fn} (${why})`, liveFns.has(fn), liveFns.has(fn) ? "" : "MISSING: the database is behind the code, apply the pending migrations");
  check("database has table id_lookup_cache (migration 084, NIN/BVN outage cache)", liveTables.has("id_lookup_cache"), liveTables.has("id_lookup_cache") ? "" : "MISSING");

  C1 = await makeUser("customer");
  P1 = await makeUser("pro-1", P1_AT); P1.kind = "pro"; P1.at = P1_AT;
  P2 = await makeUser("pro-2", P2_AT); P2.kind = "pro"; P2.at = P2_AT;
  check("created 1 customer + 2 Repair Pros (tagged, open-ocean location)", C1 && P1 && P2);

  // ───────── Scenario 1: happy path ─────────
  head("1. Happy path: request -> match -> negotiate -> pay -> work -> release -> rate");
  await setPro(P2, { is_online: false }); // deterministic: only P1 can be matched

  const noAuth = await api(null, "POST", "/api/jobs", { motoristId: C1.id });
  check("creating a job without signing in is rejected (401)", noAuth.status === 401, errMsg(noAuth));
  const wrongUser = await api(C1.token, "POST", "/api/jobs", { motoristId: P1.id, motoristName: "x", serviceType: "mechanic", problem: "abc def", lat: SITE.lat, lng: SITE.lng });
  check("creating a job on someone else's account is rejected (403)", wrongUser.status === 403, errMsg(wrongUser));
  const badType = await api(C1.token, "POST", "/api/jobs", { motoristId: C1.id, motoristName: "x", serviceType: "not-a-trade", problem: "abc def", lat: SITE.lat, lng: SITE.lng });
  check("an invalid service type is rejected (400)", badType.status === 400, errMsg(badType));
  const shortProblem = await api(C1.token, "POST", "/api/jobs", { motoristId: C1.id, motoristName: "x", serviceType: "mechanic", problem: "ab", lat: SITE.lat, lng: SITE.lng });
  check("a too-short problem description is rejected (400)", shortProblem.status === 400, errMsg(shortProblem));

  await setPro(P1, { is_online: true });
  const cid = `e2e-${RUN}-idem`;
  // A "directed" job: the customer picked this specific Repair Pro. (Open-search matching is tested in 1b.)
  const { r: cr, job: j1 } = await createJob(C1, { clientRequestId: cid, repairProId: P1.id, repairProName: P1.fullName });
  if (!check("customer creates a job", cr.ok && j1?.id, errMsg(cr))) abort("cannot continue without a job");
  check("a directed job starts waiting for the chosen Pro", j1.status === "waiting_for_selected" && j1.repairProId === P1.id, `${j1.status} / ${j1.repairProId === P1.id ? "P1" : j1.repairProId}`);
  const { job: j1b } = await createJob(C1, { clientRequestId: cid, repairProId: P1.id, repairProName: P1.fullName });
  check("replaying the same clientRequestId returns the same job (no duplicate)", j1b?.id === j1.id, `${j1.id} vs ${j1b?.id}`);
  const dupRows = await sb.from("service_requests").select("id").eq("motorist_id", C1.id).eq("client_request_id", cid);
  if (!dupRows.error) check("exactly one database row for that request", (dupRows.data || []).length === 1, `${dupRows.data?.length} rows`);

  const disp = j1;
  if (!disp) { note("no job; remaining steps of scenario 1 skipped"); } else {
    const outsider = await getJob(P2, j1.id);
    check("a Repair Pro who was NOT offered the job cannot read it", [403, 404].includes(outsider.status), errMsg(outsider));
    const anon = await getJob({ token: null }, j1.id);
    check("reading a job without signing in is rejected (401)", anon.status === 401, errMsg(anon));
    const list = await api(P1.token, "GET", `/api/jobs?userId=${P1.id}&role=repair_pro&lean=1`);
    const seen = (list.data?.jobs || []).some((j) => j.id === j1.id);
    check("the offered Repair Pro sees the job in their list", seen, errMsg(list));
    const listOther = await api(P2.token, "GET", `/api/jobs?userId=${P2.id}&role=repair_pro&lean=1`);
    check("a different Repair Pro does not see it", !(listOther.data?.jobs || []).some((j) => j.id === j1.id));

    const custOpen = await transition(C1, j1.id, "OPEN");
    check("the customer cannot perform the Pro-only 'Open' action (403)", custOpen.status === 403, errMsg(custOpen));
    const spoof = await api(C1.token, "POST", `/api/jobs/${j1.id}/transition`, { event: "OPEN", actor: "repair_pro" });
    check("claiming to be the Pro (actor spoof) is rejected (403)", spoof.status === 403, errMsg(spoof));

    const op = await transition(P1, j1.id, "OPEN");
    check("Pro taps Open -> request under review", op.ok && ["selected_review", "reserved"].includes(op.data?.job?.status), errMsg(op) + " " + (op.data?.job?.status || ""));
    const cf = await transition(P1, j1.id, "CONFIRM", gps(P1_AT));
    check("Pro taps 'I can fix this' -> negotiating", cf.ok && cf.data?.job?.status === "negotiating", errMsg(cf) + " " + (cf.data?.job?.status || ""));

    // negotiation. If the Pro could not confirm, negotiation never opened, and every check below would
    // "pass" for the wrong reason (Negotiation is closed). Report them as inconclusive instead.
    const inNeg = Boolean(cf.ok && cf.data?.job?.status === "negotiating");
    if (!inNeg) {
      note("INCONCLUSIVE: negotiation never opened, so the offer, counter-offer, discount-limit and accept checks were NOT run (they would pass for the wrong reason)");
    } else {
    const low = await api(P1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "repair_pro", actorId: P1.id, amountMajor: 50 });
    check("an offer below the minimum is rejected", !low.ok, errMsg(low));
    const zero = await api(P1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "repair_pro", actorId: P1.id, amountMajor: 0 });
    check("a zero offer is rejected (400)", zero.status === 400, errMsg(zero));
    const frac = await api(P1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "repair_pro", actorId: P1.id, amountMajor: 1000.5 });
    check("a fractional offer is rejected (400)", frac.status === 400, errMsg(frac));
    const sideSpoof = await api(C1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "repair_pro", actorId: C1.id, amountMajor: 5000 });
    check("a customer cannot place an offer as the Pro (403)", sideSpoof.status === 403, errMsg(sideSpoof));
    const actorSpoof = await api(C1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "motorist", actorId: P1.id, amountMajor: 5000 });
    check("an offer with someone else's actorId is rejected (403)", actorSpoof.status === 403, errMsg(actorSpoof));

    const ask = await api(P1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "repair_pro", actorId: P1.id, amountMajor: 8000, clientOfferId: `o1-${RUN}` });
    check("Pro places an offer of 8,000", ask.ok, errMsg(ask));
    const askAgain = await api(P1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "repair_pro", actorId: P1.id, amountMajor: 8000, clientOfferId: `o1-${RUN}` });
    check("replaying the same offer (same clientOfferId) does not add a second offer", askAgain.ok && (askAgain.data?.job?.offers?.length ?? 0) === (ask.data?.job?.offers?.length ?? 0), `offers ${ask.data?.job?.offers?.length} -> ${askAgain.data?.job?.offers?.length}`);
    const tooDeep = await api(C1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "motorist", actorId: C1.id, amountMajor: 1000 });
    check("a counter-offer beyond the maximum discount (>50% off) is rejected", !tooDeep.ok, errMsg(tooDeep));
    const counter = await api(C1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "place", side: "motorist", actorId: C1.id, amountMajor: 6000 });
    check("Customer counters with 6,000", counter.ok, errMsg(counter));
    const self = await api(C1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "accept", side: "motorist", actorId: C1.id });
    check("the customer cannot accept their own offer", !self.ok, errMsg(self));
    const acc = await api(P1.token, "POST", `/api/jobs/${j1.id}/offer`, { action: "accept", side: "repair_pro", actorId: P1.id });
    check("Pro accepts the customer's offer -> agreed at 6,000", acc.ok && acc.data?.job?.status === "agreed" && Number(acc.data?.job?.agreedMajor) === 6000, errMsg(acc) + " " + short({ s: acc.data?.job?.status, a: acc.data?.job?.agreedMajor }));
    }

    // premature actions before payment
    const early = await transition(P1, j1.id, "START_TRIP", gps(P1_AT));
    check("the Pro cannot start the trip before the customer has paid", !early.ok, errMsg(early));
    const proPay = await api(P1.token, "POST", `/api/jobs/${j1.id}/pay`, { provider: "mock" });
    check("the Pro cannot pay for the customer's job", !proPay.ok, errMsg(proPay));

    // payment
    const ps = await pay(C1, j1.id);
    if (!check("customer starts payment", ps.ok && ps.data?.reference, errMsg(ps))) { note("payment could not start; the rest of scenario 1 is skipped"); }
    else {
      if (ps.data.provider !== "mock") abort(`SAFEGUARD FAILED: payment provider resolved to "${ps.data.provider}", expected "mock". Stopping before any payment is confirmed.`);
      check("SAFEGUARD: payment provider is the mock (no real gateway can be reached)", ps.data.provider === "mock");
      check("the customer is charged at least the agreed labour (6,000), in NGN", Number(ps.data.amountMajor) >= 6000 && ps.data.currency === "NGN", short({ charge: ps.data.amountMajor, currency: ps.data.currency }));
      check("job is still 'agreed' (not booked) until payment is verified", (await jobStatus(C1, j1.id)) === "agreed");
      const wrongVerify = await api(P1.token, "POST", "/api/payments/verify", { reference: ps.data.reference });
      check("someone other than the payer cannot confirm the payment", !wrongVerify.ok, errMsg(wrongVerify));
      check("...and the job is still unbooked after that attempt", (await jobStatus(C1, j1.id)) === "agreed");
      const bogus = await api(C1.token, "POST", "/api/payments/verify", { reference: `bogus-${RUN}` });
      check("a made-up payment reference is rejected", !bogus.ok, errMsg(bogus));

      const ver = await api(C1.token, "POST", "/api/payments/verify", { reference: ps.data.reference });
      check("customer confirms payment -> escrow held, job booked", ver.ok && ver.data?.job?.status === "paid_booked", errMsg(ver) + " " + (ver.data?.job?.status || ""));
      const pay1 = ver.data?.payment || {};
      const total = Number(pay1.amountMinor), fee = Number(pay1.platformFeeMinor), proNet = Number(pay1.proPayoutMinor);
      const m = pay1.meta || {};
      const callout = Number(m.calloutMinor || 0), vat = Number(m.vatMinor || 0);
      note(`charge breakdown: labour ${m.labourMajor}, VAT ${m.vatMajor}, call-out ${m.calloutMajor ?? 0}, total ${m.chargeTotalMajor} NGN`);
      check("the charge is the agreed labour plus any call-out fee (VAT is a share inside the labour price)", total === 600000 + callout, short({ total, callout }));
      check("labour is split exactly: 87.5% pro, 5% platform, 7.5% VAT", fee === 30000 && vat === 45000 && proNet - callout === 525000, short({ fee, vat, proLabour: proNet - callout }));
      check("every kobo charged is accounted for: pro payout + platform fee + VAT = amount charged", fee + proNet + vat === total, short({ sum: fee + proNet + vat, total }));
      const ver2 = await api(C1.token, "POST", "/api/payments/verify", { reference: ps.data.reference });
      check("confirming the same payment twice is harmless (idempotent)", ver2.ok && (ver2.data?.alreadySettled === true || ver2.data?.job?.status === "paid_booked"), errMsg(ver2));
      const again = await api(C1.token, "POST", `/api/jobs/${j1.id}/pay`, { provider: "mock" });
      check("paying a job that is already paid is not charged again", again.ok && again.data?.alreadyPaid === true, errMsg(again) + " " + short(again.data));
      const rows = await dbEscrow(j1.id);
      check("exactly one escrow record exists for the job, status 'held'", rows.length === 1 && rows[0].escrow_status === "held", short(rows.map((r) => r.escrow_status)));

      // work
      const t1 = await transition(P1, j1.id, "START_TRIP", gps(P1_AT));
      check("Pro starts the trip -> en_route", t1.ok && t1.data?.job?.status === "en_route", errMsg(t1) + " " + (t1.data?.job?.status || ""));
      const custTrip = await transition(C1, j1.id, "MARK_ARRIVED");
      check("the customer cannot mark the Pro as arrived (403)", custTrip.status === 403, errMsg(custTrip));
      const t2 = await transition(P1, j1.id, "MARK_ARRIVED", gps(SITE));
      check("Pro marks arrived at the customer's location -> arrived", t2.ok && t2.data?.job?.status === "arrived", errMsg(t2) + " " + (t2.data?.job?.status || ""));
      const t3 = await transition(P1, j1.id, "START_WORK");
      check("Pro starts work -> in_progress", t3.ok && t3.data?.job?.status === "in_progress", errMsg(t3) + " " + (t3.data?.job?.status || ""));
      const proSat = await transition(P1, j1.id, "SATISFIED");
      check("the Pro cannot confirm 'satisfied' on the customer's behalf (403)", proSat.status === 403, errMsg(proSat));
      const early2 = await transition(C1, j1.id, "SATISFIED");
      check("the customer cannot release funds before the work is complete", !early2.ok, errMsg(early2));
      const t4 = await transition(P1, j1.id, "MARK_COMPLETED");
      check("Pro marks complete -> completed", t4.ok && t4.data?.job?.status === "completed", errMsg(t4) + " " + (t4.data?.job?.status || ""));
      const redo = await transition(P1, j1.id, "START_TRIP", gps(P1_AT));
      check("an out-of-order step (start trip after completion) is rejected", !redo.ok, errMsg(redo));
      check("funds remain held until the customer confirms", (await dbEscrow(j1.id))[0]?.escrow_status === "held");

      // release
      const sat = await transition(C1, j1.id, "SATISFIED");
      check("customer confirms satisfied", sat.ok, errMsg(sat) + " " + (sat.data?.job?.status || ""));
      const rel = await waitFor(async () => { const s = await jobStatus(C1, j1.id); return ["released"].includes(s) ? s : null; }, { timeout: 20000 });
      check("job reaches 'released'", rel === "released", `status ${await jobStatus(C1, j1.id)}`);
      const esc = (await dbEscrow(j1.id))[0];
      check("escrow is released", esc?.escrow_status === "released" || esc?.escrow_status === "pending_settlement", esc?.escrow_status);
      note(`escrow after release: status=${esc?.escrow_status} meta=${short(esc?.meta)}`);

      // rating
      const r0 = await api(C1.token, "POST", `/api/jobs/${j1.id}/rate`, { rating: 6 });
      check("a rating above 5 is rejected (400)", r0.status === 400, errMsg(r0));
      const rp = await api(P1.token, "POST", `/api/jobs/${j1.id}/rate`, { rating: 5 });
      check("the Pro cannot rate their own job (403)", rp.status === 403, errMsg(rp));
      const rate = await api(C1.token, "POST", `/api/jobs/${j1.id}/rate`, { rating: 5, comment: "E2E great job" });
      check("customer rates the job 5 stars", rate.ok, errMsg(rate));
      const rate2 = await api(C1.token, "POST", `/api/jobs/${j1.id}/rate`, { rating: 1, comment: "second attempt" });
      check("a second rating on the same job is rejected", !rate2.ok, errMsg(rate2));

      // chat
      let conv = (await sb.from("conversations").select("id,motorist_id,repair_pro_id,request_id").eq("request_id", j1.id).maybeSingle()).data;
      if (!conv) {
        note("no conversation was created server-side for this job; creating one as the client does, then testing messaging");
        const ins = await sb.from("conversations").insert({ motorist_id: C1.id, repair_pro_id: P1.id, request_id: j1.id }).select("id,motorist_id,repair_pro_id,request_id").single();
        conv = ins.data;
        if (ins.error) note(`conversation insert failed: ${ins.error.message}`);
      }
      if (conv) {
        const m1 = await api(C1.token, "POST", "/api/messages/send", { conversationId: conv.id, body: "E2E hello from customer" });
        check("customer sends a chat message", m1.ok, errMsg(m1));
        const m2 = await api(P1.token, "POST", "/api/messages/send", { conversationId: conv.id, body: "E2E reply from pro" });
        check("Pro replies in the chat", m2.ok, errMsg(m2));
        const m3 = await api(P2.token, "POST", "/api/messages/send", { conversationId: conv.id, body: "E2E intruder" });
        check("an outsider cannot post in someone else's chat (403)", m3.status === 403, errMsg(m3));
        const stored = await sb.from("messages").select("id").eq("conversation_id", conv.id);
        check("both messages are stored (and the intruder's is not)", (stored.data || []).length === 2, `${stored.data?.length} messages`);
      }

      // notifications
      const nProp = await sb.from("notifications").select("id,title").eq("user_id", P1.id);
      const nCust = await sb.from("notifications").select("id,title").eq("user_id", C1.id);
      check("the Pro received notifications during the job", (nProp.data || []).length > 0, `${nProp.data?.length ?? nProp.error?.message} found`);
      check("the customer received notifications during the job", (nCust.data || []).length > 0, `${nCust.data?.length ?? nCust.error?.message} found`);
    }
  }

  // ───────── 1b: automatic matching ─────────
  head("1b. Open search: the customer posts a request and the system finds a Pro");
  await setPro(P1, { is_online: true }); await setPro(P2, { is_online: true });
  const { job: j2 } = await createJob(C1);
  const d2 = j2 && (await waitDispatched(C1, j2.id, 12000));
  const dispatchWorks = Boolean(d2);
  check("an open-search job is automatically matched to a nearby online Pro", dispatchWorks, dispatchWorks ? `${d2.status}` : "NOT matched: job stays in sequential_pairing (see the SQL function checks in section 0)");

  // ───────── Scenario 2: decline and re-route ─────────
  head("2. A Pro declines -> the job is re-offered to the next Pro; customer cancels");
  if (!dispatchWorks) note("SKIPPED: re-routing depends on automatic matching, which does not work on this database (see 1b)");
  if (dispatchWorks && d2) {
    const first = pickPro(d2, P1, P2), second = first === P1 ? P2 : P1;
    check("the first Pro was chosen from the two nearby Pros", Boolean(first));
    const dec = await transition(first, j2.id, "DECLINE", { reason: "e2e decline" });
    check("the first Pro declines", dec.ok, errMsg(dec));
    const re = await waitFor(async () => { const r = await getJob(C1, j2.id); const j = r.data?.job; return j && j.repairProId === second.id ? j : null; });
    check("the job is re-offered to the OTHER Pro", Boolean(re), re ? re.status : `still ${(await getJob(C1, j2.id)).data?.job?.repairProId === first.id ? "with the first Pro" : "unassigned"}`);
    const declinedSee = await getJob(first, j2.id);
    check("the Pro who declined can no longer act on the job", !declinedSee.ok || declinedSee.data?.job?.repairProId !== first.id, errMsg(declinedSee));
    if (re) {
      const o2 = await transition(second, j2.id, "OPEN");
      const c2 = await transition(second, j2.id, "CONFIRM", gps(second.at));
      check("the second Pro opens and confirms -> negotiating", o2.ok && c2.ok && c2.data?.job?.status === "negotiating", errMsg(o2) + " | " + errMsg(c2));
      const cancel = await transition(C1, j2.id, "CANCEL", { reason: "e2e cancel" });
      check("the customer cancels during negotiation", cancel.ok, errMsg(cancel) + " " + (cancel.data?.job?.status || ""));
      note(`status after customer cancel during negotiation: ${await jobStatus(C1, j2.id)} (state machine maps negotiating+CANCEL -> searching)`);
      const noEsc = await dbEscrow(j2.id);
      check("no payment record exists for a job cancelled before payment", noEsc.length === 0, `${noEsc.length} rows`);
    }
  }

  // ───────── Scenario 3: cancel after payment -> refund ─────────
  head("3. Customer pays, then cancels before the Pro starts -> escrow is refunded");
  await setPro(P2, { is_online: false }); await setPro(P1, { is_online: true });
  const { job: j3 } = await createJob(C1, { repairProId: P1.id, repairProName: P1.fullName });
  const d3 = j3;
  if (!d3 || d3.repairProId !== P1.id) { check("job 3 created for P1", false, d3 ? d3.repairProId : "not created"); }
  else {
    await toNegotiating(C1, P1, j3.id);
    const n3 = await negotiate(C1, P1, j3.id, 5000, 4000);
    check("job 3 reaches 'agreed' at 4,000", n3.d.ok && n3.d.data?.job?.status === "agreed", errMsg(n3.d));
    const p3 = await pay(C1, j3.id);
    if (p3.ok && p3.data?.provider === "mock") {
      const v3 = await api(C1.token, "POST", "/api/payments/verify", { reference: p3.data.reference });
      check("job 3 is paid and booked", v3.ok && v3.data?.job?.status === "paid_booked", errMsg(v3));
      const can3 = await transition(C1, j3.id, "CANCEL", { reason: "e2e cancel after pay" });
      check("customer cancels the paid job (before the Pro starts)", can3.ok, errMsg(can3) + " " + (can3.data?.job?.status || ""));
      const st3 = await jobStatus(C1, j3.id);
      check("job is cancelled", st3 === "cancelled", st3);
      const esc3 = await waitFor(async () => { const e = (await dbEscrow(j3.id))[0]; return e && ["refunded", "refund_pending"].includes(e.escrow_status) ? e : null; }, { timeout: 12000 });
      const cur = (await dbEscrow(j3.id))[0];
      check("the escrow is refunded (or queued for refund), never paid out to the Pro", Boolean(esc3), `escrow status: ${cur?.escrow_status}`);
      check("no payout was made to the Pro for a cancelled job", cur?.meta?.proTransferOk !== true && cur?.meta?.payoutStatus !== "success", short(cur?.meta));
    } else check("job 3 payment started with the mock provider", false, errMsg(p3));
  }

  // ───────── Scenario 4: dispute ─────────
  head("4. Dispute after completion freezes the payout");
  const { job: j4 } = await createJob(C1, { repairProId: P1.id, repairProName: P1.fullName });
  const d4 = j4;
  if (!d4 || d4.repairProId !== P1.id) { check("job 4 created for P1", false, d4 ? d4.repairProId : "not created"); }
  else {
    await toNegotiating(C1, P1, j4.id);
    await negotiate(C1, P1, j4.id, 7000, 6500);
    const p4 = await pay(C1, j4.id);
    if (p4.ok && p4.data?.provider === "mock") {
      await api(C1.token, "POST", "/api/payments/verify", { reference: p4.data.reference });
      await transition(P1, j4.id, "START_TRIP", gps(P1_AT));
      await transition(P1, j4.id, "MARK_ARRIVED", gps(SITE));
      await transition(P1, j4.id, "START_WORK");
      const done = await transition(P1, j4.id, "MARK_COMPLETED");
      check("job 4 reaches 'completed'", done.ok, errMsg(done));
      const dp = await api(C1.token, "POST", `/api/jobs/${j4.id}/dispute`, { action: "open", by: "motorist", reason: "work_incomplete", description: "E2E: the work was not completed as agreed" });
      check("customer opens a dispute", dp.ok, errMsg(dp));
      check("job is 'disputed'", (await jobStatus(C1, j4.id)) === "disputed", await jobStatus(C1, j4.id));
      const sat4 = await transition(C1, j4.id, "SATISFIED");
      check("funds cannot be released while disputed", !sat4.ok, errMsg(sat4));
      const resolveByPro = await api(P1.token, "POST", `/api/jobs/${j4.id}/dispute`, { action: "resolve", reason: "pro says fine" });
      check("a Repair Pro cannot resolve their own dispute (needs staff)", !resolveByPro.ok, errMsg(resolveByPro));
      const e4 = (await dbEscrow(j4.id))[0];
      check("escrow is still held during the dispute", e4?.escrow_status === "held", e4?.escrow_status);
    } else check("job 4 payment started with the mock provider", false, errMsg(p4));
  }

  // ───────── Scenario 5: authorization while a job is being negotiated ─────────
  head("5. Outsiders cannot read or change someone else's negotiation");
  const C2 = await makeUser("customer");
  await setPro(P2, { is_online: false }); await setPro(P1, { is_online: true });
  const { job: j5 } = await createJob(C1, { repairProId: P1.id, repairProName: P1.fullName });
  if (!j5) check("probe job created", false, "no job");
  else {
    await toNegotiating(C1, P1, j5.id);
    const st = await jobStatus(C1, j5.id);
    check("probe job is in negotiation", st === "negotiating", st);
    const proOffer = await api(P1.token, "POST", `/api/jobs/${j5.id}/offer`, { action: "place", side: "repair_pro", actorId: P1.id, amountMajor: 8000 });
    check("the real Pro sets the price (8,000)", proOffer.ok, errMsg(proOffer));
    const custOffer = await api(C1.token, "POST", `/api/jobs/${j5.id}/offer`, { action: "place", side: "motorist", actorId: C1.id, amountMajor: 6000 });
    check("the customer counters with 6,000 (now waiting for the real Pro to accept or counter)", custOffer.ok, errMsg(custOffer));

    const readP2 = await getJob(P2, j5.id);
    check("an uninvolved Repair Pro cannot READ the job (customer location, vehicle, problem)", [403, 404].includes(readP2.status), errMsg(readP2));
    const readC2 = await getJob(C2, j5.id);
    check("another customer cannot READ the job", [403, 404].includes(readC2.status), errMsg(readC2));
    const listP2 = await api(P2.token, "GET", `/api/jobs?userId=${P2.id}&role=repair_pro&lean=1`);
    check("the job does not appear in an uninvolved Pro's job list", !(listP2.data?.jobs || []).some((j) => j.id === j5.id));

    const offP2 = await api(P2.token, "POST", `/api/jobs/${j5.id}/offer`, { action: "place", side: "repair_pro", actorId: P2.id, amountMajor: 4000 });
    check("an uninvolved Repair Pro cannot place an offer on this job (403)", offP2.status === 403, errMsg(offP2));
    const offC2 = await api(C2.token, "POST", `/api/jobs/${j5.id}/offer`, { action: "place", side: "repair_pro", actorId: C2.id, amountMajor: 4000 });
    check("another customer cannot place an offer posing as the Pro (403)", offC2.status === 403, errMsg(offC2));
    const accP2 = await api(P2.token, "POST", `/api/jobs/${j5.id}/offer`, { action: "accept", side: "repair_pro", actorId: P2.id });
    check("an uninvolved Repair Pro cannot ACCEPT the customer's 6,000 and fix the price (403)", accP2.status === 403, errMsg(accP2));
    const canP2 = await transition(P2, j5.id, "CANCEL");
    check("an uninvolved Repair Pro cannot cancel the job (403)", canP2.status === 403, errMsg(canP2));

    const after = await dbJob(j5.id);
    const offers = Array.isArray(after?.offers) ? after.offers : [];
    const foreign = offers.filter((o) => (o.actorId || o.by || o.actor_id) && ![C1.id, P1.id].includes(o.actorId || o.by || o.actor_id));
    check("the stored offers are only the two real parties' (8,000 and 6,000)", offers.length === 2 && foreign.length === 0, `offers=${offers.length}: ${short(offers.map((o) => ({ side: o.side, amount: o.amountMajor ?? o.amount })))}`);
    check("the price was NOT agreed by an outsider (still negotiating, nothing agreed)", after?.flow_status === "negotiating" && after?.agreed_major == null, `flow_status ${after?.flow_status}, agreed_major ${after?.agreed_major}`);
  }
}

async function finish(aborted) {
  // Leave Pros offline so no real traffic could ever be routed to a test account.
  for (const p of [P1, P2].filter(Boolean)) { try { await setPro(p, { is_online: false }); } catch { /* best effort */ } }
  const passed = results.filter((r) => r.pass === true).length;
  const failed = results.filter((r) => r.pass === false);
  console.log(`\n${C.b("Summary")}  ${C.g(passed + " passed")}  ${failed.length ? C.r(failed.length + " failed") : "0 failed"}${aborted ? C.r("  (run aborted: " + aborted + ")") : ""}`);
  for (const f of failed) console.log(`  ${C.r("FAIL")} [${f.section.split(".")[0]}] ${f.name}${f.detail ? C.d("  -> " + f.detail) : ""}`);
  mkdirSync(resolve(root, "reports"), { recursive: true });
  const out = resolve(root, "reports", `e2e-${RUN}.json`);
  writeFileSync(out, JSON.stringify({ run: RUN, database: projectHost, base: BASE, aborted: aborted || null, passed, failed: failed.length, results, created: { users: created.users, jobs: [...created.jobs] } }, null, 2));
  console.log(`\nManifest + results: ${out}`);
  console.log(`Remove test data:  node scripts/e2e/cleanup.mjs ${RUN}`);
  process.exit(failed.length || aborted ? 1 : 0);
}

main().then(() => finish(null)).catch((e) => { console.error(C.r("\nRun stopped: " + (e?.message || e))); finish(e?.message || String(e)); });
