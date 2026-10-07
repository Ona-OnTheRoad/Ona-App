import { timingSafeEqual } from "node:crypto";
import { requireUser } from "@/lib/server/auth-utils";

/** Server secrets are never accepted from URLs or request bodies. */
export function hasSchedulerSecret(req: Request): boolean {
  const secrets = [process.env.CRON_SECRET, process.env.JOB_EXPIRE_SECRET, process.env.ONA_CRON_SECRET]
    .map((secret) => secret?.trim()).filter((secret): secret is string => Boolean(secret));
  const authorization = req.headers.get("authorization") || "";
  const supplied = [authorization.startsWith("Bearer ") ? authorization.slice(7) : authorization,
    req.headers.get("x-cron-secret") || "", req.headers.get("x-job-expire-secret") || ""];
  return secrets.some((secret) => supplied.some((value) => {
    const expected = Buffer.from(secret);
    const actual = Buffer.from(value);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }));
}

/** Existing browser recovery remains authenticated; no open local mutation endpoint. */
export async function canRunMaintenance(req: Request): Promise<boolean> {
  if (hasSchedulerSecret(req)) return true;
  try { return (await requireUser(req)).ok; } catch { return false; }
}
