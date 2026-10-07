/** Portable scheduler client: one run by default, or sequential minute ticks with --watch. */
import { pathToFileURL } from "node:url";

export function schedulerConfig(env) {
  const base = new URL(env.DEADLINE_SWEEP_BASE_URL || "http://localhost:3100");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if ((base.protocol !== "https:" && !(base.protocol === "http:" && local)) ||
      base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("Use an HTTPS base origin, or HTTP localhost, without credentials, path or query");
  }
  const secret = [env.CRON_SECRET, env.JOB_EXPIRE_SECRET, env.ONA_CRON_SECRET]
    .map((value) => value?.trim()).find(Boolean);
  if (!secret) throw new Error("Configure a server scheduler secret");
  return { url: new URL("/api/jobs/deadline-sweep", base), secret };
}

export async function runDeadlineSweep(config, fetcher = fetch) {
  const response = await fetcher(config.url, { method: "POST", redirect: "error",
    headers: { Authorization: `Bearer ${config.secret}` }, signal: AbortSignal.timeout(55_000) });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) throw new Error(`Deadline sweep failed (HTTP ${response.status})`);
  // Whitelist counters; never echo arbitrary provider/server error payloads.
  const summary = Object.fromEntries(["pairing", "negotiation", "payments", "jobDeadlines"].map((scope) => {
    const result = payload.data?.outcomes?.[scope];
    if (!result || result.status !== "completed") throw new Error(`Missing ${scope} completion`);
    if (scope === "payments") return [scope, { inbox: result.inbox, reconciliation: result.reconciliation,
      outbox: result.outbox, jobRecovery: result.jobRecovery }];
    if (scope === "jobDeadlines") return [scope, { checked: result.checked, cancelled: result.cancelled, released: result.released }];
    return [scope, { checked: result.checked, expired: result.expired, timedOut: result.timedOut }];
  }));
  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--watch")) throw new Error("Usage: node scripts/run-deadline-sweep.mjs [--watch]");
  const config = schedulerConfig(process.env);
  const watch = args.includes("--watch");
  let stopped = false;
  let wake;
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { stopped = true; wake?.(); });
  do {
    const started = Date.now();
    try { console.log(JSON.stringify({ at: new Date().toISOString(), outcomes: await runDeadlineSweep(config) })); }
    catch (error) {
      // Do not echo fetch exceptions containing origins/credentials.
      console.error(JSON.stringify({ at: new Date().toISOString(), status: "failed",
        reason: error instanceof Error && error.message.startsWith("Deadline sweep failed") ? error.message : "Request unavailable" }));
      if (!watch) { process.exitCode = 1; return; }
    }
    if (watch && !stopped) await new Promise((resolve) => {
      const timer = setTimeout(resolve, Math.max(0, 60_000 - (Date.now() - started)));
      wake = () => { clearTimeout(timer); resolve(); };
    });
  } while (watch && !stopped);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("Scheduler configuration invalid; check base origin and server secret"); process.exitCode = 1; });
}
