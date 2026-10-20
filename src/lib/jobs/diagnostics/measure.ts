import { beginJobDiagnostic, diagnosticsEnabled } from "./collector";
import type { DiagnosticContext, JobResource } from "./types";
export type { DiagnosticContext, JobTrigger, JobSource } from "./types";

export const UNKNOWN_CONTEXT: DiagnosticContext = { source: "other", trigger: "unknown" };
export function diagnosticFailure(error: unknown) {
  return error && typeof error === "object" && "name" in error && error.name === "AbortError"
    ? "timeout" as const : "error" as const;
}

/** Measures fetch only, to response headers; never reads/clones a body or retains its URL. */
export async function measureJobHttp(resource: JobResource, context: DiagnosticContext, fetcher: () => Promise<Response>) {
  if (!diagnosticsEnabled()) return fetcher();
  const finish = beginJobDiagnostic("http", resource, context);
  try {
    const response = await fetcher();
    const rawBytes = response.headers.get("content-length");
    const bytes = rawBytes && /^\d+$/.test(rawBytes) ? Number(rawBytes) : undefined;
    const timing = response.headers.get("server-timing") ?? "";
    const duration = (stage: string) => {
      const match = timing.match(new RegExp(`(?:^|,)\\s*${stage};dur=([\\d.]+)(?:,|$)`));
      return match ? Number(match[1]) : undefined;
    };
    finish(response.ok ? "ok" : "http-error", { status: response.status, bytes,
      authMs: duration("auth"), jobLoadMs: duration("job_load"), calloutMs: duration("callout") });
    return response;
  } catch (error) { finish(diagnosticFailure(error)); throw error; }
}
