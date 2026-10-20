import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ServiceRequest } from "@/lib/types";
import { isAppBackendOnline } from "@/lib/supabase/app-api";
import { readRequestSnapshot } from "@/lib/supabase/request-snapshots";
import { useSnapshotScope } from "@/lib/jobs/use-snapshot-scope";
import { snapshotCanReplace } from "@/lib/jobs/snapshot-reads";
import { beginJobDiagnostic, recordJobDiagnostic } from "@/lib/jobs/diagnostics/collector";
import { diagnosticFailure, type JobTrigger } from "@/lib/jobs/diagnostics/measure";
import type { SessionStateResult } from "./use-session-state";

type RequestsSetter = Dispatch<SetStateAction<ServiceRequest[]>>;

export function reconcileRequests(previous: ServiceRequest[], incoming: ServiceRequest[],
  started: ServiceRequest[]): ServiceRequest[] {
  const old = new Map(previous.map((j) => [j.id, j]));
  const baseline = new Map(started.map((j) => [j.id, j]));
  const ids = new Set(incoming.map((j) => j.id));
  const next = incoming.map((job) => {
    const current = old.get(job.id);
    return snapshotCanReplace(job, current ?? null, baseline.get(job.id) ?? null) ? job : current!;
  });
  // Keep local additions/edits made after the read began until reconciliation
  // can observe them. A successful unchanged empty list really clears state.
  for (const current of previous) {
    if (!ids.has(current.id) && baseline.get(current.id) !== current) next.push(current);
  }
  // This projection is a bounded 30-row DTO, not a full job tree. Compare all
  // visible fields so same-status assignment/name/location changes reach UI.
  return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
}

export function useCloudJobs(session: SessionStateResult, requests: ServiceRequest[],
  setRequests: RequestsSetter) {
  const { backendUserId, accountType, isAuthenticated } = session;
  const scope = useSnapshotScope(backendUserId, accountType, isAuthenticated);
  const requestsRef = useRef(requests);
  useEffect(() => { requestsRef.current = requests; }, [requests]);
  useEffect(() => {
    requestsRef.current = [];
    setRequests([]);
  }, [scope, setRequests]);

  return useCallback((trigger: JobTrigger = "unknown") => {
    const capture = scope.capture();
    if (!capture || !isAppBackendOnline() || !backendUserId || !accountType) return;
    const context = { source: "cloud-store" as const, trigger };
    const started = requestsRef.current;
    const finish = beginJobDiagnostic("refresh", "requests", context);
    void capture.read("requests", () => readRequestSnapshot(backendUserId, accountType, context),
      trigger === "realtime" || trigger === "visibility" || trigger === "action",
      () => recordJobDiagnostic("trigger", "requests", context, "coalesced"))
      .then((jobs) => {
        if (!capture.isCurrent()) { finish("skipped"); return; }
        finish("ok");
        setRequests((prev) => {
          if (!capture.isCurrent()) return prev;
          const next = reconcileRequests(prev, jobs, started);
          requestsRef.current = next;
          return next;
        });
      }).catch((error: unknown) => {
        if (!capture.isCurrent()) { finish("skipped"); return; }
        finish(diagnosticFailure(error));
        console.warn("[ona] refreshCloudJobs failed", error);
      });
    recordJobDiagnostic("trigger", "requests", context, "ok");
  }, [scope, backendUserId, accountType, setRequests]);
}
