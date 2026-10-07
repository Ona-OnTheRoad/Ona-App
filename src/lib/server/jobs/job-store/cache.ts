import "server-only";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import type { JobRecord } from "@/lib/jobs/types";
import { jobToDbPatch, nowIso } from "./mappers";
import { JobPersistenceUnavailableError, JobWriteConflictError } from "./persistence-errors";

export async function persist(job: JobRecord): Promise<JobRecord> {
  if (!isSupabaseAdminConfigured()) throw new JobPersistenceUnavailableError();
  try {
    const sb = createServiceSupabase();
    const patch = jobToDbPatch(job);
    const { data, error } = await sb
      .from("service_requests")
      .update(patch)
      .eq("id", job.id)
      .eq("job_version", job.jobVersion ?? 0)
      .select("job_version")
      .maybeSingle();
    if (error) {
      console.error("job persist failed", job.id, job.status, error.message);
      throw new JobPersistenceUnavailableError("Could not save the complete job update");
    }
    if (!data) throw new JobWriteConflictError(job.id);
    job.jobVersion = Number(data.job_version);
    try {
      await sb.from("job_events").insert({
        request_id: job.id,
        event_type: "status",
        payload: { status: job.status },
      });
    } catch {
      /* optional table */
    }
  } catch (e) {
    console.error("job persist exception", e);
    if (e instanceof JobWriteConflictError || e instanceof JobPersistenceUnavailableError) throw e;
    throw new JobPersistenceUnavailableError();
  }
  return job;
}

export async function persistIfUnchanged(
  job: JobRecord,
  expectedUpdatedAt: string,
): Promise<JobRecord | null> {
  if (!isSupabaseAdminConfigured()) throw new JobPersistenceUnavailableError();
  try {
    const sb = createServiceSupabase();
    const patch = jobToDbPatch(job);
    const { data, error } = await sb
      .from("service_requests")
      .update(patch)
      .eq("id", job.id)
      .eq("job_version", job.jobVersion ?? 0)
      .eq("updated_at", expectedUpdatedAt)
      .select("*")
      .maybeSingle();
    if (error) throw new JobPersistenceUnavailableError("Could not save the complete job update");
    if (!data) return null;
    job.jobVersion = Number(data.job_version);
    return job;
  } catch (error) {
    if (error instanceof JobPersistenceUnavailableError) throw error;
    throw new JobPersistenceUnavailableError();
  }
}
