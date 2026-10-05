import { useCallback, useEffect, useState } from "react";
import { apiListJobs } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_PAST } from "./pro-past-format";

export function useProPastJobs(backendUserId: string | null | undefined) {
  const [past, setPast] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Backup: auto-cancel Booked jobs past 6h (server enforces + refunds)
    try {
      const { apiExpireStaleBookedJobs } = await import("@/lib/jobs/client");
      await apiExpireStaleBookedJobs();
    } catch {
      /* ignore */
    }
    if (!backendUserId) {
      setPast([]);
      setLoading(false);
      return;
    }
    const res = await apiListJobs(backendUserId, "repair_pro");
    if (!res.ok) {
      setErr(res.message);
      setPast([]);
      setLoading(false);
      return;
    }
    const mine = res.data.jobs.filter((j) => {
      if (j.repairProId !== backendUserId) return false;
      if (!j.motoristId || !j.problem?.trim()) return false;
      return true;
    });

    const finished = mine
      .filter((j) => PRO_PAST.has(j.status))
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )
      .slice(0, 40);

    setPast(finished);
    setErr(null);
    setLoading(false);
  }, [backendUserId]);

  useEffect(() => {
    void load();
    // Realtime is primary; backup poll only (past jobs list)
    const t = window.setInterval(() => {
      if (document.hidden) return;
      void load();
    }, 120_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  return { past, loading, err };
}
