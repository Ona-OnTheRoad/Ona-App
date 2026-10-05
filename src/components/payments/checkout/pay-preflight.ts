import type { JobRecord } from "@/lib/jobs/types";
import type { PayGate } from "@/lib/pay-telemetry";

export type PayPreflight =
  | { ok: true; payEmail: string; payerId: string }
  | {
      ok: false;
      gate: PayGate;
      detail: Record<string, unknown>;
      message: string;
    };

/** Pure pre-pay validation: email, payer id and customer-account match. */
export function evaluatePayPreflight({
  current,
  profileEmail,
  backendUserId,
  actorId,
}: {
  current: JobRecord;
  profileEmail: string | undefined;
  backendUserId: string | null | undefined;
  actorId: string;
}): PayPreflight {
  const payEmail = (profileEmail || "").trim();
  if (!payEmail.includes("@")) {
    return {
      ok: false,
      gate: "no-email",
      detail: { jobId: current.id, email: payEmail || "(blank)" },
      message: "Add a valid email on your profile before paying.",
    };
  }
  const payerId =
    (backendUserId && backendUserId.length > 10 ? backendUserId : null) ||
    (current.motoristId && current.motoristId.length > 10
      ? current.motoristId
      : null) ||
    actorId;
  if (!payerId || payerId === "local-user" || payerId.includes("@")) {
    return {
      ok: false,
      gate: "no-payer-id",
      detail: {
        jobId: current.id,
        backendUserId: backendUserId || null,
        motoristId: current.motoristId || null,
        actorId: actorId || null,
      },
      message: "Session not ready. Pull to refresh, then try again.",
    };
  }
  if (current.motoristId && payerId !== current.motoristId) {
    if (backendUserId === current.motoristId) {
      /* ok */
    } else if (backendUserId) {
      return {
        ok: false,
        gate: "wrong-motorist",
        detail: {
          jobId: current.id,
          actorId: actorId || null,
          motoristId: current.motoristId || null,
        },
        message: "Sign in with the customer account that created this job.",
      };
    }
  }
  return { ok: true, payEmail, payerId };
}
