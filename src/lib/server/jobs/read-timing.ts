import "server-only";
type ReadStage = "auth" | "job_load" | "callout";

/** Optional response metadata only. Aggregate job_load includes contact/quote hydration. */
export function createJobReadTiming() {
  const enabled = process.env.JOB_READ_TIMING_ENABLED === "true";
  const stages = new Map<ReadStage, number>();
  return {
    async measure<T>(stage: ReadStage, operation: () => Promise<T>): Promise<T> {
      if (!enabled) return operation();
      const started = performance.now();
      try { return await operation(); }
      finally { stages.set(stage, Math.max(0, performance.now() - started)); }
    },
    attach(response: Response) {
      if (enabled && stages.size) response.headers.set("Server-Timing",
        [...stages].map(([stage, duration]) => `${stage};dur=${duration.toFixed(2)}`).join(","));
      return response;
    },
  };
}
