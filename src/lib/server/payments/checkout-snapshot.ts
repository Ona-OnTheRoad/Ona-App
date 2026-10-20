import "server-only";
import type { JobRecord } from "@/lib/jobs/types";
import { loadConfirmationJob } from "./confirmation-store";

/** Classification writes may advance the version, but cannot change the obligation. */
export async function refreshCheckoutSnapshot(previous: JobRecord): Promise<JobRecord | null> {
  const current = await loadConfirmationJob(previous.id);
  if (!current || current.status !== "agreed") return null;
  const unchangedFields = [
    "motoristId", "repairProId", "agreedMajor", "proBaseMajor", "currency",
    "serviceType", "paymentReference", "paymentId", "escrowStatus",
  ] as const;
  if (unchangedFields.some((field) => current[field] !== previous[field])) return null;
  // A cancel/reopen or another payment session must not be mistaken for classification.
  if (JSON.stringify(current.statusHistory) !== JSON.stringify(previous.statusHistory) ||
      JSON.stringify(current.motoristLocation) !== JSON.stringify(previous.motoristLocation) ||
      JSON.stringify(current.proLocation) !== JSON.stringify(previous.proLocation)) return null;
  return current;
}
