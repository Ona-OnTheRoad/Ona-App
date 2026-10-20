import { useCallback, useEffect, useRef } from "react";
import { mergeJobRelatedFields } from "@/lib/jobs/snapshot-reads";
import { useSnapshotScope } from "@/lib/jobs/use-snapshot-scope";
import type { AccountType } from "@/lib/types";
import { apiCreateJob } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { isJobNewer } from "../job-flow/job-utils";
import type { JobFlowState } from "./use-job-flow-state";

interface Args {
  jobId: string;
  backendUserId: string | null;
  accountType: AccountType | null;
  authReady: boolean;
  isAuthenticated: boolean;
  s: JobFlowState;
}

/**
 * Seeds / optimistically paints the job, creates `/jobs/new` requests in the
 * background and exposes `commitJob` (newer-wins job merge).
 */
export function useJobBootstrap({
  jobId,
  backendUserId,
  accountType,
  authReady,
  isAuthenticated,
  s,
}: Args) {
  const { setJob, jobRef, activeJobIdRef, setErr } = s;
  const scope = useSnapshotScope(backendUserId, accountType, isAuthenticated, jobId);
  const commitJob = useCallback(
    (next: JobRecord, force = false) => {
      const capture = scope.capture();
      if (!capture) return;
      setJob((prev) => {
        if (!capture.isCurrent() || activeJobIdRef.current !== next.id) return prev;
        if (prev?.id === next.id && Number.isSafeInteger(prev.jobVersion) &&
          Number.isSafeInteger(next.jobVersion) && next.jobVersion! < prev.jobVersion!) return prev;
        if (!force && prev && !isJobNewer(next, prev)) return prev;
        const merged = mergeJobRelatedFields(next, prev);
        jobRef.current = merged;
        return merged;
      });
    },
    [scope, activeJobIdRef, setJob, jobRef],
  );

  // Instant paint: the help flow hands us the just-created job via
  // sessionStorage so the searching screen shows before the first GET.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(`ona-seed-job:${jobId}`);
      if (!raw) return;
      window.sessionStorage.removeItem(`ona-seed-job:${jobId}`);
      const seed = JSON.parse(raw) as JobRecord;
      if (seed?.id !== jobId) return;
      setJob((prev) => {
        if (prev?.id === seed.id && isJobNewer(prev, seed)) return prev;
        jobRef.current = seed;
        return seed;
      });
    } catch {
      /* ignore */
    }
  }, [jobId, setJob, jobRef]);

  // `/jobs/new` two-phase: the help flow navigated here with the full request
  // payload instead of waiting on POST. Paint the searching screen from an
  // optimistic job instantly, then create the real job in the background.
  const isNewRequest = jobId === "new";
  const createdNewRef = useRef(false);
  useEffect(() => {
    if (!isNewRequest) return;
    try {
      const raw = window.sessionStorage.getItem("ona-new-request");
      if (!raw) {
        // Already created earlier this session (user refreshed mid-search):
        // point loaders at the real job id.
        const created = window.sessionStorage.getItem("ona-new-job:new");
        if (created) activeJobIdRef.current = created;
        return;
      }
      // A fresh pending request supersedes any previously-created mapping.
      window.sessionStorage.removeItem("ona-new-job:new");
      const payload = JSON.parse(raw) as Record<string, unknown>;
      const ts = new Date().toISOString();
      const optimistic: JobRecord = {
        id: `pending-${Math.random().toString(36).slice(2, 10)}`,
        motoristId: String(payload.motoristId ?? ""),
        motoristName: String(payload.motoristName ?? "Customer"),
        motoristPhoto: (payload.motoristPhoto as string | null) ?? null,
        motoristVehicle: (payload.motoristVehicle as string | null) ?? null,
        repairProId: "",
        repairProName: "",
        serviceType: String(payload.serviceType) as JobRecord["serviceType"],
        problem: String(payload.problem ?? ""),
        voiceNote: (payload.voiceNote as JobRecord["voiceNote"]) ?? null,
        photos: Array.isArray(payload.photos)
          ? (payload.photos as JobRecord["photos"])
          : [],
        status: "sequential_pairing",
        currency: String(payload.currency ?? "NGN") as JobRecord["currency"],
        proBaseMajor: null,
        agreedMajor: null,
        offers: [],
        negotiateEndsAt: ts,
        maxOffers: 6,
        locationLabel: String(payload.locationLabel ?? ""),
        motoristLocation: {
          lat: Number(payload.lat ?? 0),
          lng: Number(payload.lng ?? 0),
        },
        statusHistory: [
          { status: "sequential_pairing", at: ts, by: "motorist" },
        ],
        createdAt: ts,
        updatedAt: ts,
      };
      setJob((prev) => {
        if (prev) return prev;
        jobRef.current = optimistic;
        return optimistic;
      });
    } catch {
      /* ignore fall back to the normal loading + poll path */
    }
  }, [isNewRequest, setJob, jobRef, activeJobIdRef]);

  // Background create once auth is ready; swap activeJobIdRef to the real id
  // so the existing poll/loader machinery takes over seamlessly. We stay on
  // /jobs/new swapping the URL mid-search suspends the page (Suspense
  // "Loading…" flash).
  useEffect(() => {
    if (!isNewRequest) return;
    if (createdNewRef.current) return;
    const capture = scope.capture();
    if (!capture) return;
    // One-click: don't wait for authReady lag — payload already carries motoristId;
    // server validates JWT on apiCreateJob, and seed job is already painted.
    if (!authReady) {
      // Defer one tick for session to hydrate, but don't block 4s
      const t = window.setTimeout(() => {
        if (!createdNewRef.current) {
          createdNewRef.current = true;
          void (async () => {
            try {
              const raw = window.sessionStorage.getItem("ona-new-request");
              if (!raw) return;
              const payload = JSON.parse(raw) as Record<string, unknown>;
              const res = await apiCreateJob(payload);
              if (!capture.isCurrent()) return;
              if (!res.ok) {
                setErr(
                  res.message || "Could not send your request. Try again.",
                );
                createdNewRef.current = false;
                return;
              }
              try {
                window.sessionStorage.setItem(
                  "ona-new-job:new",
                  res.data.job.id,
                );
              } catch {}
              window.sessionStorage.removeItem("ona-new-request");
              activeJobIdRef.current = res.data.job.id;
              commitJob(res.data.job, true);
            } catch {
              if (!capture.isCurrent()) return;
              setErr("Could not send your request. Try again.");
              createdNewRef.current = false;
            }
          })();
        }
      }, 400);
      return () => window.clearTimeout(t);
    }
    createdNewRef.current = true;
    const create = async () => {
      try {
        const raw = window.sessionStorage.getItem("ona-new-request");
        if (!raw) return;
        const payload = JSON.parse(raw) as Record<string, unknown>;
        const res = await apiCreateJob(payload);
        if (!capture.isCurrent()) return;
        if (!res.ok) {
          // Search screen stays visible with the error; Cancel returns home.
          setErr(res.message || "Could not send your request. Try again.");
          return;
        }
        // Record the real id so a refresh on /jobs/new still resolves to the
        // live job, then hand over to the poll machinery with no URL change.
        try {
          window.sessionStorage.setItem("ona-new-job:new", res.data.job.id);
        } catch {
          /* ignore */
        }
        window.sessionStorage.removeItem("ona-new-request");
        activeJobIdRef.current = res.data.job.id;
        commitJob(res.data.job, true);
      } catch {
        if (!capture.isCurrent()) return;
        setErr("Could not send your request. Try again.");
      }
    };
    void create();
  }, [
    scope,
    isNewRequest,
    authReady,
    isAuthenticated,
    commitJob,
    activeJobIdRef,
    setErr,
  ]);
  return { commitJob };
}
