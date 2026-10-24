#!/usr/bin/env node
/**
 * Native Node.js Load & Stress Harness for Ona
 *
 * Runs realistic persona journeys (Standby Repair Pros + Active/Idle Motorists)
 * concurrently using native Node HTTP fetch and Supabase Realtime WebSockets.
 *
 * Zero external tools or cloud subscriptions required.
 *
 * NOTE ON CAPACITY NUMBERS:
 *   Ramp and stress results against a local `next dev` server are NOT representative
 *   due to on-demand TypeScript compilation and hot-reloading overhead.
 *   For true production-representative capacity numbers, run against:
 *   `npm run build && npm run start`.
 *
 * Usage:
 *   # Default Soak Mode
 *   node scripts/simulate-load.mjs --pros 40 --motorists 10 --duration 30
 *
 *   # Open-Model Stress / Ramp Mode
 *   node scripts/simulate-load.mjs --mode ramp --step-duration 20 --start-rps 5 --step-rps 5 --max-rps 100
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

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
function getFloatArg(name, def) {
  const val = getArg(name, null);
  if (val !== null) {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return def;
}

const MODE = getArg("--mode", "soak"); // "soak" | "ramp"
const BASE_URL = getArg("--base-url", process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const DURATION_SEC = getNumArg("--duration", 30);
const WARMUP_SEC = getNumArg("--warmup", 5);
const PRO_CONCURRENCY = getNumArg("--pros", 20);
const MOTORIST_CONCURRENCY = getNumArg("--motorists", 5);
const REALTIME_WRITES = getNumArg("--realtime-writes", 0);
const REQUEST_TIMEOUT_MS = getNumArg("--request-timeout-ms", 10000);
const MAX_P95_MS = getNumArg("--max-p95-ms", 1000);
const MAX_ERROR_RATE = getFloatArg("--max-error-rate", 1.0);
const MANIFEST_PATH = getArg("--synthetic-manifest", resolve(root, "tmp-audit/synthetic-manifest-latest.json"));

// Ramp-specific parameters (R6)
const STEP_DURATION_SEC = getNumArg("--step-duration", 20);
const START_RPS = getNumArg("--start-rps", 5);
const STEP_RPS = getNumArg("--step-rps", 5);
const MAX_RPS = getNumArg("--max-rps", 100);
const MAX_INFLIGHT = getNumArg("--max-inflight", 200);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("❌ Error: Missing Supabase URL or Anon Key in environment.");
  process.exit(1);
}

// Telemetry & metrics collector
function createMetricBucket() {
  return {
    total: 0,
    success: 0,
    authErrors: 0,   // 401, 403
    clientErrors: 0, // other 4xx
    serverErrors: 0, // 5xx
    networkErrors: 0,// timeout / network exception
    droppedInflight: 0,
    statusCodes: {},
    latencies: [],
  };
}

const metrics = {
  warmup: createMetricBucket(),
  steady: {
    overall: createMetricBucket(),
    repair_pro: createMetricBucket(),
    customer: createMetricBucket(),
  },
  rampSteps: [],
  realtime: {
    outcomes: {
      SUBSCRIBED: 0,
      CHANNEL_ERROR: 0,
      TIMED_OUT: 0,
      CLOSED: 0,
    },
    subscribeTimes: [],
    eventsExpected: 0,
    eventsReceived: 0,
    lags: [],
  },
  personas: {
    prosActive: 0,
    motoristsActive: 0,
  },
};

// Track dispatched write timestamps by clientRequestId
const activeJobWrites = new Map();

let earlyAuthCheckDone = false;
let globalAbortController = null;
let runStartTimestamp = 0;

function recordRequest(role, status, latencyMs, isNetworkError = false, stepBucket = null) {
  const isWarmup = (Date.now() - runStartTimestamp) < (WARMUP_SEC * 1000);
  const targetBucket = isWarmup ? metrics.warmup : metrics.steady.overall;
  const roleBucket = isWarmup ? null : metrics.steady[role];

  const updateBucket = (b) => {
    b.total++;
    b.latencies.push(latencyMs);

    if (isNetworkError) {
      b.networkErrors++;
      b.statusCodes["NETWORK_ERROR"] = (b.statusCodes["NETWORK_ERROR"] || 0) + 1;
    } else {
      b.statusCodes[status] = (b.statusCodes[status] || 0) + 1;
      if (status >= 200 && status < 400) {
        b.success++;
      } else if (status === 401 || status === 403) {
        b.authErrors++;
      } else if (status >= 400 && status < 500) {
        b.clientErrors++;
      } else if (status >= 500) {
        b.serverErrors++;
      }
    }
  };

  updateBucket(targetBucket);
  if (roleBucket) updateBucket(roleBucket);
  if (stepBucket) updateBucket(stepBucket);

  // R2: Check early auth failure (>= 50% of the first 20 requests)
  const totalChecked = metrics.warmup.total + metrics.steady.overall.total;
  const totalAuthErrors = metrics.warmup.authErrors + metrics.steady.overall.authErrors;

  if (!earlyAuthCheckDone && totalChecked >= 20) {
    earlyAuthCheckDone = true;
    const authRate = totalAuthErrors / totalChecked;
    if (authRate >= 0.5) {
      console.error(`\n\n🚨 AUTH FAILURE: ${totalAuthErrors}/${totalChecked} early requests returned 401/403.`);
      console.error("Likely causes:");
      console.error("- User tokens are invalid or expired.");
      console.error("- Supabase project in .env.local does not match the seeded synthetic users.");
      console.error("- /api/jobs requireUser() rejected the Authorization Bearer header.\n");
      if (globalAbortController) {
        globalAbortController.abort();
      }
      setTimeout(() => process.exit(2), 200);
    }
  }
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
 * Load users from synthetic manifest (R1)
 */
function loadUsersFromManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`\n❌ Error: Synthetic manifest not found at ${MANIFEST_PATH}`);
    console.error(`Please generate synthetic users first using:`);
    console.error(`  node scripts/synthetic-seed.mjs --customers ${MOTORIST_CONCURRENCY} --pros ${PRO_CONCURRENCY}\n`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch (err) {
    console.error(`❌ Error parsing manifest at ${MANIFEST_PATH}:`, err.message);
    process.exit(1);
  }

  const { pros = [], customers = [], password } = data;

  if (!password) {
    console.error(`❌ Error: Manifest missing shared password.`);
    process.exit(1);
  }

  if (pros.length < PRO_CONCURRENCY || customers.length < MOTORIST_CONCURRENCY) {
    console.error(`\n❌ Error: Manifest contains fewer users than requested.`);
    console.error(`  Requested: ${PRO_CONCURRENCY} pros, ${MOTORIST_CONCURRENCY} customers`);
    console.error(`  Available: ${pros.length} pros, ${customers.length} customers`);
    console.error(`Please generate enough users with:`);
    console.error(`  node scripts/synthetic-seed.mjs --customers ${MOTORIST_CONCURRENCY} --pros ${PRO_CONCURRENCY}\n`);
    process.exit(1);
  }

  return {
    password,
    pros: pros.slice(0, PRO_CONCURRENCY),
    motorists: customers.slice(0, MOTORIST_CONCURRENCY),
  };
}

/**
 * Authenticate users concurrently with limited batching (R1)
 */
async function authenticateUsers(users, password, role) {
  process.stdout.write(`🔑 Signing in ${users.length} synthetic ${role}s... `);
  const authResults = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (u) => {
      const client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: true },
      });
      const { data, error } = await client.auth.signInWithPassword({
        email: u.email,
        password,
      });
      if (error || !data?.session?.access_token) {
        return { user: u, client: null, error: error?.message || "No access token" };
      }
      return {
        user: u,
        client,
        session: data.session,
        error: null,
      };
    });
    const res = await Promise.all(batchPromises);
    authResults.push(...res);
  }

  const successful = authResults.filter((r) => !r.error);
  const failed = authResults.filter((r) => r.error);

  if (failed.length > 0) {
    process.stdout.write(`⚠️  (${successful.length} ok, ${failed.length} failed)\n`);
    console.warn(`Sample auth error: ${failed[0].error}`);
  } else {
    process.stdout.write(`✓ (${successful.length} ok)\n`);
  }

  if (successful.length === 0) {
    console.error(`❌ Fatal: All ${role} authentications failed.`);
    process.exit(2);
  }

  return successful;
}

/**
 * Refresh user session token if close to expiry
 */
async function getValidAccessToken(authData) {
  const { client, session } = authData;
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at - now < 120) {
    const { data, error } = await client.auth.refreshSession();
    if (!error && data?.session) {
      authData.session = data.session;
      return data.session.access_token;
    }
  }
  return session.access_token;
}

/**
 * Persona 1: Standby Repair Pro (Soak Mode)
 */
async function runRepairPro(authData, stopSignal) {
  metrics.personas.prosActive++;
  const { user, client, session } = authData;
  let isConnected = false;

  if (session?.access_token) {
    client.realtime.setAuth(session.access_token);
  }

  const subStart = performance.now();
  let subOutcomeRecorded = false;

  const channel = client.channel(`user-jobs:${user.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "jobs", filter: `repair_pro_id=eq.${user.id}` }, (payload) => {
      const now = Date.now();
      metrics.realtime.eventsReceived++;

      const reqId = payload.new?.client_request_id || payload.new?.id;
      if (reqId && activeJobWrites.has(reqId)) {
        const writeTime = activeJobWrites.get(reqId);
        const lag = Math.max(0, now - writeTime);
        metrics.realtime.lags.push(lag);
      }
    })
    .subscribe((status) => {
      if (!subOutcomeRecorded) {
        if (status === "SUBSCRIBED") {
          subOutcomeRecorded = true;
          metrics.realtime.outcomes.SUBSCRIBED++;
          metrics.realtime.subscribeTimes.push(Math.round(performance.now() - subStart));
        } else if (status === "CHANNEL_ERROR") {
          subOutcomeRecorded = true;
          metrics.realtime.outcomes.CHANNEL_ERROR++;
        } else if (status === "TIMED_OUT") {
          subOutcomeRecorded = true;
          metrics.realtime.outcomes.TIMED_OUT++;
        } else if (status === "CLOSED") {
          subOutcomeRecorded = true;
          metrics.realtime.outcomes.CLOSED++;
        }
      }
      isConnected = (status === "SUBSCRIBED");
    });

  try {
    while (!stopSignal.aborted) {
      const pollDelayMs = isConnected ? 10_000 : 3_000;
      const token = await getValidAccessToken(authData);
      const start = performance.now();

      try {
        const res = await fetch(`${BASE_URL}/api/jobs?userId=${user.id}&role=repair_pro&lean=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        const duration = Math.round(performance.now() - start);
        recordRequest("repair_pro", res.status, duration, false);
      } catch {
        const duration = Math.round(performance.now() - start);
        recordRequest("repair_pro", 0, duration, true);
      }

      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, pollDelayMs)),
        new Promise((resolve) => stopSignal.addEventListener("abort", resolve, { once: true })),
      ]);
    }
  } finally {
    metrics.personas.prosActive--;
  }
}

/**
 * Persona 2: Active / Browsing Motorist (Soak Mode)
 */
async function runMotorist(authData, stopSignal) {
  metrics.personas.motoristsActive++;
  const { user } = authData;
  try {
    while (!stopSignal.aborted) {
      const delayMs = 5000 + Math.floor(Math.random() * 3000);
      const token = await getValidAccessToken(authData);
      const start = performance.now();

      try {
        const res = await fetch(`${BASE_URL}/api/jobs?userId=${user.id}&role=motorist&lean=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        const duration = Math.round(performance.now() - start);
        recordRequest("customer", res.status, duration, false);
      } catch {
        const duration = Math.round(performance.now() - start);
        recordRequest("customer", 0, duration, true);
      }

      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, delayMs)),
        new Promise((resolve) => stopSignal.addEventListener("abort", resolve, { once: true })),
      ]);
    }
  } finally {
    metrics.personas.motoristsActive--;
  }
}

/**
 * R4: Synthetic Controlled Realtime Job Writer
 */
async function runControlledWriter(motoristAuths, proAuths, count, durationSec, stopSignal) {
  if (count <= 0 || motoristAuths.length === 0 || proAuths.length === 0) return;

  const intervalMs = Math.max(500, Math.floor((durationSec * 1000) / count));
  console.log(`📡 Realtime Writer activated: scheduling ${count} synthetic job updates (every ~${(intervalMs / 1000).toFixed(1)}s)...`);

  for (let i = 0; i < count; i++) {
    if (stopSignal.aborted) break;

    const motorist = motoristAuths[i % motoristAuths.length];
    const targetPro = proAuths[i % proAuths.length];
    const clientReqId = `load-test-${Date.now()}-${i}`;
    const token = await getValidAccessToken(motorist);

    const jobPayload = {
      motoristId: motorist.user.id,
      motoristName: motorist.user.full_name || "Synthetic Motorist",
      repairProId: targetPro.user.id,
      serviceType: targetPro.user.service || "mechanic",
      problem: `Load simulation synthetic test job ${i + 1}`,
      lat: targetPro.user.lat || 6.5244,
      lng: targetPro.user.lng || 3.3792,
      clientRequestId: clientReqId,
    };

    metrics.realtime.eventsExpected++;
    activeJobWrites.set(clientReqId, Date.now());

    try {
      await fetch(`${BASE_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobPayload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {}

    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, intervalMs)),
      new Promise((resolve) => stopSignal.addEventListener("abort", resolve, { once: true })),
    ]);
  }
}

/**
 * R6: Open-Model Stress / Ramp Mode Runner
 * Executes increasing RPS steps until failure threshold is reached or max-rps hit
 */
async function runRampMode(proAuths, motoristAuths) {
  console.log("\n⚡ COMMENCING OPEN-MODEL RAMP / STRESS BENCHMARK");
  console.log(`Step Duration:       ${STEP_DURATION_SEC}s`);
  console.log(`Rate Schedule:       ${START_RPS} RPS -> +${STEP_RPS} RPS/step up to ${MAX_RPS} RPS`);
  console.log(`In-flight Cap:       ${MAX_INFLIGHT}`);
  console.log(`Thresholds:          p95 <= ${MAX_P95_MS}ms, Error Rate <= ${MAX_ERROR_RATE}%\n`);

  const allAuths = [
    ...proAuths.map((a) => ({ ...a, role: "repair_pro" })),
    ...motoristAuths.map((a) => ({ ...a, role: "motorist" })),
  ];

  let currentTargetRps = START_RPS;
  let userIndex = 0;
  let inflight = 0;
  let sustainableCapacity = null;
  let breakingPoint = null;

  console.log("---------------------------------------------------------------------------------------------");
  console.log(" Step | Target RPS | Achieved RPS | p50 (ms) | p95 (ms) | p99 (ms) | Errors | Dropped | Status ");
  console.log("---------------------------------------------------------------------------------------------");

  let stepNumber = 1;
  while (currentTargetRps <= MAX_RPS) {
    const stepBucket = createMetricBucket();
    const stepStart = performance.now();
    const intervalMs = 1000 / currentTargetRps;
    const pendingDispatches = [];

    const stepAbort = new AbortController();
    const stepTimer = setTimeout(() => stepAbort.abort(), STEP_DURATION_SEC * 1000);

    const dispatchInterval = setInterval(async () => {
      if (stepAbort.signal.aborted) return;

      if (inflight >= MAX_INFLIGHT) {
        stepBucket.droppedInflight++;
        return;
      }

      const authData = allAuths[userIndex % allAuths.length];
      userIndex++;
      inflight++;

      const reqPromise = (async () => {
        const token = await getValidAccessToken(authData);
        const start = performance.now();
        const roleParam = authData.role;
        const apiRole = roleParam === "motorist" ? "customer" : "repair_pro";

        try {
          const res = await fetch(`${BASE_URL}/api/jobs?userId=${authData.user.id}&role=${roleParam}&lean=1`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
          const dur = Math.round(performance.now() - start);
          recordRequest(apiRole, res.status, dur, false, stepBucket);
        } catch {
          const dur = Math.round(performance.now() - start);
          recordRequest(apiRole, 0, dur, true, stepBucket);
        } finally {
          inflight--;
        }
      })();

      pendingDispatches.push(reqPromise);
    }, intervalMs);

    await new Promise((resolve) => stepAbort.signal.addEventListener("abort", resolve, { once: true }));
    clearInterval(dispatchInterval);
    clearTimeout(stepTimer);

    // Drain remaining in-flight requests for this step (max 3s)
    await Promise.race([
      Promise.allSettled(pendingDispatches),
      new Promise((r) => setTimeout(r, 3000)),
    ]);

    const actualDurationSec = (performance.now() - stepStart) / 1000;
    const achievedRps = (stepBucket.total / actualDurationSec).toFixed(1);
    const stepStats = calculatePercentiles(stepBucket.latencies);
    const stepFailed = stepBucket.authErrors + stepBucket.clientErrors + stepBucket.serverErrors + stepBucket.networkErrors;
    const stepErrorRate = stepBucket.total > 0
      ? ((stepFailed / stepBucket.total) * 100).toFixed(2)
      : "0.00";

    const p95Healthy = stepStats.p95 <= MAX_P95_MS;
    const errorHealthy = parseFloat(stepErrorRate) <= MAX_ERROR_RATE;
    const stepHealthy = p95Healthy && errorHealthy;

    const statusLabel = stepHealthy ? "HEALTHY" : "BREACH";

    console.log(
      ` ${stepNumber.toString().padStart(4, " ")} | ` +
      `${currentTargetRps.toString().padStart(10, " ")} | ` +
      `${achievedRps.toString().padStart(12, " ")} | ` +
      `${stepStats.p50.toString().padStart(8, " ")} | ` +
      `${stepStats.p95.toString().padStart(8, " ")} | ` +
      `${stepStats.p99.toString().padStart(8, " ")} | ` +
      `${stepFailed.toString().padStart(6, " ")} | ` +
      `${stepBucket.droppedInflight.toString().padStart(7, " ")} | ` +
      `${statusLabel}`
    );

    metrics.rampSteps.push({
      step: stepNumber,
      targetRps: currentTargetRps,
      achievedRps: parseFloat(achievedRps),
      p50: stepStats.p50,
      p95: stepStats.p95,
      p99: stepStats.p99,
      failed: stepFailed,
      dropped: stepBucket.droppedInflight,
      errorRate: parseFloat(stepErrorRate),
      status: statusLabel,
    });

    if (stepHealthy) {
      sustainableCapacity = { targetRps: currentTargetRps, achievedRps: parseFloat(achievedRps), p95: stepStats.p95 };
    } else {
      breakingPoint = { targetRps: currentTargetRps, achievedRps: parseFloat(achievedRps), p95: stepStats.p95, errorRate: parseFloat(stepErrorRate) };
      break; // Halt ramp upon failure threshold breach
    }

    currentTargetRps += STEP_RPS;
    stepNumber++;
  }

  console.log("---------------------------------------------------------------------------------------------\n");
  console.log("RAMP / STRESS TEST CAPACITY SUMMARY:");
  if (sustainableCapacity) {
    console.log(`  Sustainable Capacity:     ${sustainableCapacity.achievedRps} RPS (Target: ${sustainableCapacity.targetRps} RPS, p95: ${sustainableCapacity.p95}ms)`);
  } else {
    console.log(`  Sustainable Capacity:     0 RPS (Failed at initial step)`);
  }
  if (breakingPoint) {
    console.log(`  Breaking Point Detected:  ${breakingPoint.targetRps} RPS (p95: ${breakingPoint.p95}ms, Error Rate: ${breakingPoint.errorRate}%)`);
  } else {
    console.log(`  Breaking Point:           None (Sustained all rates up to ${MAX_RPS} RPS)`);
  }
  console.log("");
}

function getGitCommitHash() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

async function main() {
  console.log("\n🚀 Starting Ona Native Load & Stress Simulation Harness");
  console.log(`Mode:               ${MODE.toUpperCase()}`);
  console.log(`Target Base URL:    ${BASE_URL}`);
  if (MODE === "soak") {
    console.log(`Duration:           ${DURATION_SEC}s (Warm-up: ${WARMUP_SEC}s)`);
  }
  console.log(`Concurrency:        ${PRO_CONCURRENCY} Pros, ${MOTORIST_CONCURRENCY} Motorists`);
  console.log(`Supabase Realtime:  ${supabaseUrl}`);

  if (BASE_URL.includes("localhost:3000") || BASE_URL.includes("127.0.0.1:3000")) {
    console.log("\n⚠️  NOTICE: Target is local Next.js dev server.");
    console.log("   Latencies include on-demand compilation overhead and are not production-representative.");
    console.log("   For production capacity benchmarking, run against 'next build && next start'.");
  }

  if (REALTIME_WRITES > 0) {
    console.log(`\n⚠️  WARNING: --realtime-writes=${REALTIME_WRITES} is enabled.`);
    console.log(`   This will write synthetic test jobs to ${supabaseUrl}`);
    console.log(`   Run 'node scripts/synthetic-cleanup.mjs' afterwards to prune test records.\n`);
  } else {
    console.log("");
  }

  // R1: Load users from manifest
  const { pros, motorists, password } = loadUsersFromManifest();

  // R1: Authenticate users before timed run starts
  const proAuths = await authenticateUsers(pros, password, "pro");
  const motoristAuths = await authenticateUsers(motorists, password, "customer");
  console.log("✓ All user sessions established. Commencing benchmark.\n");

  globalAbortController = new AbortController();
  runStartTimestamp = Date.now();

  // R6: Branch by mode (ramp vs soak)
  if (MODE === "ramp") {
    await runRampMode(proAuths, motoristAuths);
  } else {
    // Default Soak Mode
    const proPromises = proAuths.map((authData) => runRepairPro(authData, globalAbortController.signal));
    const motoristPromises = motoristAuths.map((authData) => runMotorist(authData, globalAbortController.signal));
    const writerPromise = runControlledWriter(
      motoristAuths,
      proAuths,
      REALTIME_WRITES,
      DURATION_SEC,
      globalAbortController.signal
    );

    let elapsed = 0;
    const progressInterval = setInterval(() => {
      elapsed += 2;
      const isWarmup = elapsed <= WARMUP_SEC;
      const phaseLabel = isWarmup ? "WARM-UP" : "STEADY";
      const totalReqs = metrics.warmup.total + metrics.steady.overall.total;
      const totalAuths = metrics.warmup.authErrors + metrics.steady.overall.authErrors;

      process.stdout.write(
        `\r⏳ [${elapsed.toString().padStart(2, " ")}s / ${DURATION_SEC}s] [${phaseLabel}] ` +
        `Pros: ${metrics.personas.prosActive} | ` +
        `Custs: ${metrics.personas.motoristsActive} | ` +
        `HTTP Reqs: ${totalReqs} | ` +
        `Auth 401/403: ${totalAuths} `
      );
    }, 2000);

    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, DURATION_SEC * 1000)),
      new Promise((resolve) => globalAbortController.signal.addEventListener("abort", resolve, { once: true })),
    ]);

    if (!globalAbortController.signal.aborted) {
      globalAbortController.abort();
    }
    clearInterval(progressInterval);
    process.stdout.write("\n\nInitiating clean teardown...\n");

    const safetyTimeout = setTimeout(() => {
      console.warn("⚠️ Warning: Teardown took longer than 5 seconds. Force exiting.");
      process.exit(0);
    }, 5000);
    safetyTimeout.unref();

    const teardownPromises = proAuths.map(({ client }) => {
      if (client) {
        try {
          client.removeAllChannels();
          client.realtime.disconnect();
        } catch {}
      }
    });

    await Promise.allSettled([...proPromises, ...motoristPromises, writerPromise, ...teardownPromises]);
    clearTimeout(safetyTimeout);
  }

  const totalWallTime = ((Date.now() - runStartTimestamp) / 1000).toFixed(1);
  const steadyDuration = Math.max(1, DURATION_SEC - WARMUP_SEC);

  // Compute overall statistics
  const steadyStats = calculatePercentiles(metrics.steady.overall.latencies);
  const warmupStats = calculatePercentiles(metrics.warmup.latencies);
  const proStats = calculatePercentiles(metrics.steady.repair_pro.latencies);
  const custStats = calculatePercentiles(metrics.steady.customer.latencies);

  const subStats = calculatePercentiles(metrics.realtime.subscribeTimes);
  const lagStats = calculatePercentiles(metrics.realtime.lags);

  const totalSteadyReqs = metrics.steady.overall.total;
  const steadyFailed = metrics.steady.overall.authErrors +
    metrics.steady.overall.clientErrors +
    metrics.steady.overall.serverErrors +
    metrics.steady.overall.networkErrors;

  const steadyErrorRate = totalSteadyReqs > 0
    ? ((steadyFailed / totalSteadyReqs) * 100).toFixed(2)
    : "0.00";
  const rps = (totalSteadyReqs / steadyDuration).toFixed(1);

  const p95Pass = steadyStats.p95 <= MAX_P95_MS;
  const errorPass = parseFloat(steadyErrorRate) <= MAX_ERROR_RATE;
  const overallVerdict = p95Pass && errorPass ? "PASS" : "FAIL";

  console.log("\n=================================================================");
  console.log("             ONA LOAD & STRESS SIMULATION REPORT                 ");
  console.log("=================================================================");
  console.log(`Execution Mode:             ${MODE.toUpperCase()}`);
  console.log(`Execution Duration:         ${totalWallTime}s wall time`);
  console.log(`Measured Throughput:        ${rps} req/sec`);
  console.log(`Steady Error Rate:          ${steadyErrorRate}% (${steadyFailed} failed out of ${totalSteadyReqs})`);
  console.log("-----------------------------------------------------------------");
  console.log("Outcome Taxonomy (Steady Window):");
  console.log(`  Success (2xx/3xx):        ${metrics.steady.overall.success}`);
  console.log(`  Auth Errors (401/403):    ${metrics.steady.overall.authErrors}`);
  console.log(`  Client Errors (4xx):      ${metrics.steady.overall.clientErrors}`);
  console.log(`  Server Errors (5xx):      ${metrics.steady.overall.serverErrors}`);
  console.log(`  Network / Timeouts:       ${metrics.steady.overall.networkErrors}`);
  console.log("-----------------------------------------------------------------");
  console.log("HTTP Latencies Breakdown (ms):");
  console.log(`  Steady Overall:           p50: ${steadyStats.p50}ms | p90: ${steadyStats.p90}ms | p95: ${steadyStats.p95}ms | p99: ${steadyStats.p99}ms | max: ${steadyStats.max}ms`);
  console.log(`  Repair Pros:              p50: ${proStats.p50}ms | p90: ${proStats.p90}ms | p95: ${proStats.p95}ms | p99: ${proStats.p99}ms | max: ${proStats.max}ms`);
  console.log(`  Motorists:                p50: ${custStats.p50}ms | p90: ${custStats.p90}ms | p95: ${custStats.p95}ms | p99: ${custStats.p99}ms | max: ${custStats.max}ms`);
  console.log("-----------------------------------------------------------------");
  console.log(`VERDICT:                    ${overallVerdict}`);
  console.log(`  p95 Latency:              ${steadyStats.p95}ms (Threshold: <= ${MAX_P95_MS}ms) -> ${p95Pass ? "PASS" : "FAIL"}`);
  console.log(`  Error Rate:               ${steadyErrorRate}% (Threshold: <= ${MAX_ERROR_RATE}%) -> ${errorPass ? "PASS" : "FAIL"}`);
  console.log("=================================================================\n");

  // Export JSON Report to reports/load/<timestamp>.json
  const reportPayload = {
    timestamp: new Date().toISOString(),
    gitCommit: getGitCommitHash(),
    targetUrl: BASE_URL,
    mode: MODE,
    config: {
      durationSec: DURATION_SEC,
      warmupSec: WARMUP_SEC,
      pros: PRO_CONCURRENCY,
      motorists: MOTORIST_CONCURRENCY,
      realtimeWrites: REALTIME_WRITES,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      maxP95Ms: MAX_P95_MS,
      maxErrorRate: MAX_ERROR_RATE,
      stepDurationSec: STEP_DURATION_SEC,
      startRps: START_RPS,
      stepRps: STEP_RPS,
      maxRps: MAX_RPS,
      maxInflight: MAX_INFLIGHT,
    },
    verdict: {
      result: overallVerdict,
      p95Pass,
      errorPass,
    },
    metrics: {
      throughputRps: parseFloat(rps),
      steadyDurationSec: steadyDuration,
      steady: {
        overall: { ...metrics.steady.overall, percentiles: steadyStats },
        repair_pro: { ...metrics.steady.repair_pro, percentiles: proStats },
        customer: { ...metrics.steady.customer, percentiles: custStats },
      },
      warmup: { ...metrics.warmup, percentiles: warmupStats },
      rampSteps: metrics.rampSteps,
      realtime: {
        ...metrics.realtime,
        subscribePercentiles: subStats,
        lagPercentiles: lagStats,
      },
    },
  };

  const reportsDir = resolve(root, "reports/load");
  mkdirSync(reportsDir, { recursive: true });
  const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const reportPath = resolve(reportsDir, filename);
  writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2));
  console.log(`📁 Detailed JSON report saved to: ${reportPath}\n`);
}

main().catch((err) => {
  console.error("Fatal simulation error:", err);
  process.exit(1);
});
