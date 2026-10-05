"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetJob } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { useApp } from "@/lib/store";

/** Loads the job for the view-only process page + its (read-only) chat thread. */
export function useRequestDetail(id: string) {
  const router = useRouter();
  const {
    accountType,
    backendUserId,
    visibleMessageThreads,
    refreshCloudChats,
  } = useApp();

  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await apiGetJob(id);
    if (!res.ok) {
      if (res.message === "Job not found") {
        router.replace(accountType === "professional" ? "/jobs" : "/");
        return;
      }
      setErr(res.message || "Could not load job");
      setJob(null);
      setLoading(false);
      return;
    }
    const j = res.data.job;
    if (
      backendUserId &&
      j.motoristId !== backendUserId &&
      j.repairProId !== backendUserId
    ) {
      setErr("You do not have access to this job.");
      setJob(null);
      setLoading(false);
      return;
    }
    setJob(j);
    setErr(null);
    setLoading(false);
  }, [id, backendUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void refreshCloudChats();
  }, [refreshCloudChats, id]);

  const chatThread = useMemo(() => {
    if (!job) return null;
    return (
      visibleMessageThreads.find(
        (t) => t.requestId === job.id || t.id === job.id,
      ) ?? null
    );
  }, [job, visibleMessageThreads]);

  return { job, loading, err, chatThread };
}
