import { SOURCES, TRIGGERS, RESOURCES, OUTCOMES, type DiagnosticContext, type DiagnosticEvent, type Kind, type JobResource, type Outcome } from "./types";

export const MAX_DIAGNOSTIC_EVENTS = 1000;
let enabled = false;
let epoch = 0;
let origin = 0;
let stoppedAt = 0;
const SCENARIOS = ["unspecified", "idle", "pairing", "negotiation", "trip", "hidden", "reconnect", "two-tabs"] as const;
let scenario: typeof SCENARIOS[number] = "unspecified";
let dropped = 0;
let events: DiagnosticEvent[] = [];
const active = new Map<string, number>();
const lastEvent = new Map<DiagnosticContext["source"], number>();
const clock = () => performance.now();
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
const rounded = (n: number) => Math.round(n * 100) / 100;
const p95 = (values: number[]) => values.length ? values.sort((a, b) => a - b)[Math.ceil(values.length * .95) - 1] : null;

export function diagnosticsEnabled() { return enabled; }
export function clearJobDiagnostics() {
  epoch++; events = []; dropped = 0; active.clear(); lastEvent.clear(); origin = clock(); stoppedAt = origin;
}
export function startJobDiagnostics(label: typeof SCENARIOS[number] = "unspecified") {
  clearJobDiagnostics(); scenario = SCENARIOS.includes(label) ? label : "unspecified"; enabled = true;
}
export function stopJobDiagnostics() {
  if (enabled) stoppedAt = clock();
  enabled = false; epoch++; active.clear();
}

// Build a closed schema at runtime: even untyped callers cannot retain arbitrary data.
export function recordJobDiagnostic(kind: Kind, resource: JobResource, context: DiagnosticContext, outcome: Outcome,
  detail: Partial<Pick<DiagnosticEvent, "durationMs" | "concurrent" | "status" | "bytes" | "authMs" | "jobLoadMs" | "calloutMs" | "eventToResponseMs">> = {}) {
  if (!enabled || !["http", "refresh", "trigger", "subscription", "subscription-consumer"].includes(kind) ||
      !RESOURCES.includes(resource) || !SOURCES.includes(context.source) ||
      !TRIGGERS.includes(context.trigger) || !OUTCOMES.includes(outcome)) return;
  const event: DiagnosticEvent = { kind, resource, source: context.source, trigger: context.trigger,
    outcome, atMs: rounded(Math.max(0, clock() - origin)) };
  if ((kind === "subscription" || kind === "subscription-consumer") && outcome === "event") lastEvent.set(context.source, clock());
  for (const key of ["durationMs", "concurrent", "status", "bytes", "authMs", "jobLoadMs", "calloutMs", "eventToResponseMs"] as const) {
    if (finite(detail[key])) event[key] = rounded(detail[key]);
  }
  if (events.length === MAX_DIAGNOSTIC_EVENTS) { events.shift(); dropped++; }
  events.push(event);
}

export function beginJobDiagnostic(kind: "http" | "refresh", resource: JobResource, context: DiagnosticContext) {
  if (!enabled || (kind !== "http" && kind !== "refresh") || !RESOURCES.includes(resource) || !SOURCES.includes(context.source) || !TRIGGERS.includes(context.trigger)) {
    const noop: (outcome: Outcome, detail?: Parameters<typeof recordJobDiagnostic>[4]) => void = () => {};
    return noop;
  }
  const generation = epoch;
  const started = clock();
  const receivedAt = context.trigger === "realtime" ? lastEvent.get(context.source) : undefined;
  const key = `${kind}:${resource}`;
  const concurrent = (active.get(key) ?? 0) + 1;
  active.set(key, concurrent);
  let finished = false;
  return (outcome: Outcome, detail?: Parameters<typeof recordJobDiagnostic>[4]) => {
    if (finished || generation !== epoch) return;
    finished = true;
    active.set(key, Math.max(0, (active.get(key) ?? 1) - 1));
    recordJobDiagnostic(kind, resource, context, outcome, { ...detail, durationMs: clock() - started, concurrent,
      eventToResponseMs: receivedAt === undefined ? undefined : clock() - receivedAt });
  };
}

/** Statistics describe retained completed samples, not all-time traffic or per-job duplication. */
export function jobDiagnosticsSnapshot() {
  const buckets = new Map<string, DiagnosticEvent[]>();
  for (const e of events) {
    const key = `${e.kind}/${e.source}/${e.resource}/${e.trigger}`;
    const samples = buckets.get(key) ?? []; samples.push(e); buckets.set(key, samples);
  }
  return { enabled, scenario, retained: events.length, dropped, capacity: MAX_DIAGNOSTIC_EVENTS,
    inFlight: Object.fromEntries(active),
    durationMs: rounded(Math.max(0, (enabled ? clock() : stoppedAt) - origin)),
    groups: [...buckets].map(([label, samples]) => {
      const durations = samples.flatMap((e) => e.durationMs === undefined ? [] : [e.durationMs]).sort((a, b) => a - b);
      const withBytes = samples.filter((e) => e.bytes !== undefined);
      const eventDurations = samples.flatMap((e) => e.outcome !== "ok" || e.eventToResponseMs === undefined ? [] : [e.eventToResponseMs]).sort((a, b) => a - b);
      return { label, count: samples.length, p95Ms: durations.length ? durations[Math.ceil(durations.length * .95) - 1] : null,
        maxConcurrent: Math.max(0, ...samples.map((e) => e.concurrent ?? 0)),
        bytesSamples: withBytes.length, knownBytes: withBytes.length ? withBytes.reduce((n, e) => n + e.bytes!, 0) : null,
        p95EventToResponseMs: eventDurations.length ? eventDurations[Math.ceil(eventDurations.length * .95) - 1] : null,
        p95AuthMs: p95(samples.flatMap((e) => e.authMs === undefined ? [] : [e.authMs])),
        p95JobLoadMs: p95(samples.flatMap((e) => e.jobLoadMs === undefined ? [] : [e.jobLoadMs])),
        p95CalloutMs: p95(samples.flatMap((e) => e.calloutMs === undefined ? [] : [e.calloutMs])),
        outcomes: Object.fromEntries(OUTCOMES.map((outcome) => [outcome, samples.filter((e) => e.outcome === outcome).length])) };
    }), events: events.map((e) => ({ ...e })) };
}

declare global {
  interface Window { onaJobDiagnostics?: { start: typeof startJobDiagnostics; stop: typeof stopJobDiagnostics;
    clear: typeof clearJobDiagnostics; snapshot: typeof jobDiagnosticsSnapshot } }
}
if (typeof window !== "undefined") {
  window.onaJobDiagnostics = { start: startJobDiagnostics, stop: stopJobDiagnostics,
    clear: clearJobDiagnostics, snapshot: jobDiagnosticsSnapshot };
}
