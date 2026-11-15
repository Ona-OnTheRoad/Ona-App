#!/usr/bin/env node
/**
 * Remove everything scripts/e2e/lifecycle.mjs created.
 *
 * Only touches accounts whose email ends with @ona-e2e.invalid (a reserved TLD that cannot
 * belong to a real person) AND whose name starts with "E2E-TEST". Pass a run id to limit it
 * to one run:   node scripts/e2e/cleanup.mjs [runId] [--dry]
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: resolve(root, ".env.local") });

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const runId = args.find((a) => !a.startsWith("--")) || "";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing Supabase URL / service role key"); process.exit(2); }
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
console.log(`database: ${new URL(url).host}${DRY ? "  (dry run, nothing deleted)" : ""}${runId ? `  run: ${runId}` : "  (all e2e runs)"}`);

const isE2E = (p) => String(p.email || "").toLowerCase().endsWith("@ona-e2e.invalid") && String(p.full_name || "").startsWith("E2E-TEST");

const { data: profs, error } = await sb.from("profiles").select("id,email,full_name").ilike("email", "%@ona-e2e.invalid");
if (error) { console.error("profiles query failed:", error.message); process.exit(1); }
const targets = (profs || []).filter(isE2E).filter((p) => !runId || p.email.includes(`.${runId}.`));
console.log(`found ${targets.length} test account(s)`);
if (!targets.length) process.exit(0);

const ids = targets.map((t) => t.id);
const quiet = async (label, fn) => {
  if (DRY) return console.log(`  would delete ${label}`);
  try { const r = await fn(); if (r?.error) console.log(`  ${label}: skipped (${r.error.message})`); else console.log(`  deleted ${label}`); }
  catch (e) { console.log(`  ${label}: skipped (${e.message})`); }
};

const { data: jobs } = await sb.from("service_requests").select("id").or(`motorist_id.in.(${ids.join(",")}),repair_pro_id.in.(${ids.join(",")})`);
const jobIds = (jobs || []).map((j) => j.id);
console.log(`jobs: ${jobIds.length}`);
const { data: convs } = jobIds.length ? await sb.from("conversations").select("id").in("request_id", jobIds) : { data: [] };
const convIds = (convs || []).map((c) => c.id);

if (convIds.length) await quiet("messages", () => sb.from("messages").delete().in("conversation_id", convIds));
if (convIds.length) await quiet("conversations", () => sb.from("conversations").delete().in("id", convIds));
if (jobIds.length) {
  await quiet("payments (escrow)", () => sb.from("payments").delete().in("request_id", jobIds));
  await quiet("pairing queue", () => sb.from("request_pairing_queue").delete().in("request_id", jobIds));
  await quiet("reviews", () => sb.from("reviews").delete().in("request_id", jobIds));
  await quiet("job outbox", () => sb.from("job_outbox").delete().in("job_id", jobIds));
}
await quiet("notifications", () => sb.from("notifications").delete().in("user_id", ids));
if (jobIds.length) await quiet("service_requests (jobs)", () => sb.from("service_requests").delete().in("id", jobIds));
await quiet("repair_pro_profiles", () => sb.from("repair_pro_profiles").delete().in("user_id", ids));
await quiet("motorist_profiles", () => sb.from("motorist_profiles").delete().in("user_id", ids));
await quiet("profiles", () => sb.from("profiles").delete().in("id", ids));
for (const t of targets) await quiet(`auth user ${t.email}`, () => sb.auth.admin.deleteUser(t.id));

if (!DRY) {
  const left = await sb.from("profiles").select("id").in("id", ids);
  const leftJobs = jobIds.length ? await sb.from("service_requests").select("id").in("id", jobIds) : { data: [] };
  console.log(`\nverify: ${(left.data || []).length} test profile(s) and ${(leftJobs.data || []).length} test job(s) remain`);
}
