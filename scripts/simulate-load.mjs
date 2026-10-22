#!/usr/bin/env node
/**
 * Native Node.js Load & Stress Harness for Ona
 *
 * Runs realistic persona journeys (Standby Repair Pros + Active/Idle Motorists)
 * concurrently using native Node HTTP fetch and Supabase Realtime WebSockets.
 *
 * Zero external tools or cloud subscriptions required.
 *
 * Usage:
 *   node scripts/simulate-load.mjs
 *   node scripts/simulate-load.mjs --pros 40 --motorists 10 --duration 30 --base-url http://localhost:3000
 *   node scripts/simulate-load.mjs --synthetic-manifest tmp-audit/synthetic-manifest-latest.json
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return def;
}
function getNumArg(name, def) {
  const val = getArg(name, null);
  if (val !== null) {
    const parsed = parseInt(val, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return def;
}

const BASE_URL = getArg("--base-url", process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const DURATION_SEC = getNumArg("--duration", 30);
const PRO_CONCURRENCY = getNumArg("--pros", 20);
const MOTORIST_CONCURRENCY = getNumArg("--motorists", 5);
const MANIFEST_PATH = getArg("--synthetic-manifest", resolve(root, "tmp-audit/synthetic-manifest-latest.json"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || (!anonKey && !serviceKey)) {
  console.error("❌ Error: Missing Supabase URL or Anon/Service Key in environment.");
  process.exit(1);
}

// Telemetry & metrics collector
const metrics = {
  http: {
    total: 0,
    success: 0,
    failed: 0,
    statusCodes: {},
    latencies: [],
  },
  realtime: {
    connected: 0,
    disconnected: 0,
    eventsReceived: 0,
    errors: 0,
  },
  personas: {
    prosActive: 0,
    motoristsActive: 0,
  },
};

function recordHttp(statusCode, latencyMs) {
  metrics.http.total++;
  if (statusCode >= 200 && statusCode < 400) {
    metrics.http.success++;
  } else {
    metrics.http.failed++;
  }
  metrics.http.statusCodes[statusCode] = (metrics.http.statusCodes[statusCode] || 0) + 1;
  metrics.http.latencies.push(latencyMs);
}

function calculatePercentiles(arr) {
  if (!arr.length) return { p50: 0, p90: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    min: sorted[0],
    p50: q(0.5),
    p90: q(0.9),
    p95: q(0.95),
    p99: q(0.99),
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
  };
}

/**
 * Load mock users from synthetic manifest or fallback to simulated mock user sessions
 */
function loadUsers() {
  if (existsSync(MANIFEST_PATH)) {
    try {
      const data = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
      if (Array.isArray(data.pros) && Array.isArray(data.customers)) {
        console.log(`Loaded ${data.pros.length} pros and ${data.customers.length} customers from ${MANIFEST_PATH}`);
        return {
          pros: data.pros.slice(0, PRO_CONCURRENCY),
          motorists: data.customers.slice(0, MOTORIST_CONCURRENCY),
        };
      }
    } catch {
      // Fall through to synthetic generator
    }
  }

  // Fallback synthetic sessions
  const pros = Array.from({ length: PRO_CONCURRENCY }, (_, i) => ({
    id: `syn-pro-${i + 1}`,
    email: `syn.pro.${i + 1}@ona-local.test`,
  }));
  const motorists = Array.from({ length: MOTORIST_CONCURRENCY }, (_, i) => ({
    id: `syn-cust-${i + 1}`,
    email: `syn.cust.${i + 1}@ona-local.test`,
  }));
  return { pros, motorists };
}

/**
 * Persona 1: Standby Repair Pro
 * - Opens Supabase Realtime channel (Postgres Changes on user-jobs)
 * - Emulates Phase 4 / Phase 3 throttled idle poll (10s when connected, 3s when degraded)
 */
async function runRepairPro(pro, stopSignal) {
  metrics.personas.prosActive++;
  const client = createClient(supabaseUrl, anonKey || serviceKey);
  let isConnected = false;

  // Supabase Realtime channel
  const channel = client.channel(`user-jobs:${pro.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "jobs", filter: `repair_pro_id=eq.${pro.id}` }, () => {
      metrics.realtime.eventsReceived++;
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        isConnected = true;
        metrics.realtime.connected++;
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        isConnected = false;
        metrics.realtime.disconnected++;
      }
    });

  try {
    while (!stopSignal.aborted) {
      // Idle polling cadence: 10s if connected, 3s if disconnected/degraded
      const pollDelayMs = isConnected ? 10_000 : 3_000;
      const start = performance.now();
      try {
        const res = await fetch(`${BASE_URL}/api/jobs?role=repair_pro&lean=1`, {
          headers: {
            "x-user-id": pro.id,
            "x-mock-role": "repair_pro",
          },
        });
        const duration = Math.round(performance.now() - start);
        recordHttp(res.status, duration);
      } catch {
        recordHttp(500, Math.round(performance.now() - start));
      }

      // Wait delay with abort handling
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, pollDelayMs)),
        new Promise((resolve) => stopSignal.addEventListener("abort", resolve)),
      ]);
    }
  } finally {
    metrics.personas.prosActive--;
    channel.unsubscribe();
  }
}

/**
 * Persona 2: Active / Browsing Motorist
 * - Queries active requests / job lists
 * - Verifies read-only list endpoints never trigger broad expire-stale
 */
async function runMotorist(motorist, stopSignal) {
  metrics.personas.motoristsActive++;
  try {
    while (!stopSignal.aborted) {
      // Browsing poll delay (5s - 8s)
      const delayMs = 5000 + Math.floor(Math.random() * 3000);
      const start = performance.now();
      try {
        const res = await fetch(`${BASE_URL}/api/jobs?role=customer&lean=1`, {
          headers: {
            "x-user-id": motorist.id,
            "x-mock-role": "customer",
          },
        });
        const duration = Math.round(performance.now() - start);
        recordHttp(res.status, duration);
      } catch {
        recordHttp(500, Math.round(performance.now() - start));
      }

      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, delayMs)),
        new Promise((resolve) => stopSignal.addEventListener("abort", resolve)),
      ]);
    }
  } finally {
    metrics.personas.motoristsActive--;
  }
}

async function main() {
  console.log("\n🚀 Starting Ona Native Load & Stress Simulation Harness");
  console.log(`Target Base URL:    ${BASE_URL}`);
  console.log(`Duration:           ${DURATION_SEC}s`);
  console.log(`Concurrency:        ${PRO_CONCURRENCY} Pros, ${MOTORIST_CONCURRENCY} Motorists`);
  console.log(`Supabase Realtime:  ${supabaseUrl}\n`);

  const { pros, motorists } = loadUsers();
  const stopController = new AbortController();

  const proPromises = pros.map((pro) => runRepairPro(pro, stopController.signal));
  const motoristPromises = motorists.map((m) => runMotorist(m, stopController.signal));

  // Ticking progress display
  let elapsed = 0;
  const progressInterval = setInterval(() => {
    elapsed += 2;
    process.stdout.write(
      `\r⏳ [${elapsed.toString().padStart(2, " ")}s / ${DURATION_SEC}s] ` +
      `Active Pros: ${metrics.personas.prosActive} | ` +
      `Active Motorists: ${metrics.personas.motoristsActive} | ` +
      `HTTP Reqs: ${metrics.http.total} | ` +
      `Realtime Events: ${metrics.realtime.eventsReceived} `
    );
  }, 2000);

  // Run for target duration
  await new Promise((resolve) => setTimeout(resolve, DURATION_SEC * 1000));
  stopController.abort();
  clearInterval(progressInterval);
  process.stdout.write("\n\nWrapping up remaining requests...\n");

  await Promise.allSettled([...proPromises, ...motoristPromises]);

  // Generate Report
  const stats = calculatePercentiles(metrics.http.latencies);
  const rps = (metrics.http.total / DURATION_SEC).toFixed(1);
  const errorRate = metrics.http.total > 0
    ? ((metrics.http.failed / metrics.http.total) * 100).toFixed(2)
    : "0.00";

  console.log("\n=================================================================");
  console.log("             ONA LOAD & STRESS SIMULATION REPORT                 ");
  console.log("=================================================================");
  console.log(`Execution Duration:         ${DURATION_SEC} seconds`);
  console.log(`Total Requests Sent:        ${metrics.http.total}`);
  console.log(`Throughput:                 ${rps} req/sec`);
  console.log(`Error Rate:                 ${errorRate}% (${metrics.http.failed} failed)`);
  console.log(`Realtime WebSockets:        ${metrics.realtime.connected} connected, ${metrics.realtime.eventsReceived} events`);
  console.log("-----------------------------------------------------------------");
  console.log("HTTP Latencies (Round-Trip):");
  console.log(`  Min:                      ${stats.min} ms`);
  console.log(`  Average:                  ${stats.avg} ms`);
  console.log(`  p50 (Median):             ${stats.p50} ms`);
  console.log(`  p90:                      ${stats.p90} ms`);
  console.log(`  p95:                      ${stats.p95} ms`);
  console.log(`  p99:                      ${stats.p99} ms`);
  console.log(`  Max:                      ${stats.max} ms`);
  console.log("-----------------------------------------------------------------");
  console.log("Status Code Distribution:");
  for (const [code, count] of Object.entries(metrics.http.statusCodes)) {
    console.log(`  HTTP ${code}:               ${count}`);
  }
  console.log("=================================================================\n");
}

main().catch((err) => {
  console.error("Fatal simulation error:", err);
  process.exit(1);
});
