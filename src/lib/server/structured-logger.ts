import "server-only";
const SAFE_CONTEXT_KEYS = new Set([
  "requestId", "jobId", "paymentId", "route", "operation", "provider",
  "status", "outcome", "attempt", "errorCode", "errorName",
]);

type LogContext = Record<string, unknown>;

function requestIdFrom(request?: Request): string | undefined {
  const value = request?.headers.get("x-request-id")?.trim();
  return value && /^[A-Za-z0-9._-]{1,64}$/.test(value) ? value : undefined;
}

function safeContext(context: LogContext = {}, request?: Request) {
  const result: Record<string, string | number | boolean> = {};
  const requestId = requestIdFrom(request) ?? context.requestId;
  if (typeof requestId === "string" && /^[A-Za-z0-9._-]{1,64}$/.test(requestId)) {
    result.requestId = requestId;
  }
  for (const [key, value] of Object.entries(context)) {
    if (key === "requestId" || !SAFE_CONTEXT_KEYS.has(key)) continue;
    if (typeof value === "string" && value.length <= 160) result[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) result[key] = value;
    else if (typeof value === "boolean") result[key] = value;
  }
  return result;
}

function serialize(level: "info" | "warn" | "error", event: string, context: LogContext, request?: Request, error?: unknown) {
  const detail = error instanceof Error
    ? {
      errorName: error.name,
      ...(typeof (error as Error & { code?: unknown }).code === "string"
      ? { errorCode: (error as Error & { code: string }).code }
      : {}),
    }
    : error === undefined ? {} : { errorName: "UnknownError" };
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...safeContext({ ...context, ...detail }, request),
  });
}

export const serverLogger = {
  info(event: string, context: LogContext = {}, request?: Request) {
    console.info(serialize("info", event, context, request));
  },
  warn(event: string, context: LogContext = {}, request?: Request, error?: unknown) {
    console.warn(serialize("warn", event, context, request, error));
  },
  error(event: string, context: LogContext = {}, request?: Request, error?: unknown) {
    console.error(serialize("error", event, context, request, error));
  },
};
