export const SOURCES = ["job-screen", "cloud-store", "dashboard", "incoming", "release", "callout", "checkout", "discovery", "past-jobs", "requests-page", "history", "job-entry", "request-detail", "chat", "notification", "job-action", "other"] as const;
export const TRIGGERS = ["initial", "interval", "realtime", "visibility", "focus", "maintenance", "retry", "action", "unknown"] as const;
export const RESOURCES = ["job", "jobs", "requests", "incoming-status", "callout", "expire-stale", "pairing-sweep"] as const;
export const OUTCOMES = ["ok", "http-error", "error", "timeout", "coalesced", "skipped", "opened", "subscribed", "channel-error", "closed", "removed", "event", "unavailable"] as const;
export type JobSource = typeof SOURCES[number];
export type JobTrigger = typeof TRIGGERS[number];
export type JobResource = typeof RESOURCES[number];
export type DiagnosticContext = { source: JobSource; trigger: JobTrigger };
export type Outcome = typeof OUTCOMES[number];
export type Kind = "http" | "refresh" | "trigger" | "subscription";
export type DiagnosticEvent = DiagnosticContext & {
  kind: Kind; resource: JobResource; outcome: Outcome; atMs: number;
  durationMs?: number; concurrent?: number; status?: number; bytes?: number;
  authMs?: number; jobLoadMs?: number; calloutMs?: number;
  eventToResponseMs?: number;
};
