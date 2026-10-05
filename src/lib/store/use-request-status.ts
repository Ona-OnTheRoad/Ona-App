import { useCallback } from "react";
import { skillLockBlock, verificationGate } from "@/lib/accept-guards";
import { advanceDeskRequest, deskRoleFor } from "@/lib/jobs/desk-transition";
import { isAppBackendOnline } from "@/lib/supabase/app-api";
import type { ServiceRequest } from "@/lib/types";
import { ACCEPT_VIA_JOB_FLOW_MESSAGE } from "./constants";
import type { ServiceActionResult } from "./types";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";
import type { ProfilePersistenceResult } from "./use-profile-persistence";

export function useRequestStatus(
  session: SessionStateResult,
  market: MarketStateResult,
  profileApi: ProfilePersistenceResult,
) {
  const { accountType, userProfile, registeredAs, proServices, backendUserId } =
    session;
  const { requests, setRequests } = market;
  const { persistProfile } = profileApi;

  const updateRequestStatus = useCallback(
    async (
      id: string,
      status: ServiceRequest["status"],
    ): Promise<ServiceActionResult> => {
      const count = userProfile?.serviceActionCount ?? 0;
      const fail = (
        code: Extract<ServiceActionResult, { ok: false }>["code"],
        message: string,
      ): ServiceActionResult => ({
        ok: false,
        code,
        message,
        actionCount: count,
      });

      const existing = requests.find((r) => r.id === id);
      if (!existing) return fail("not_found", "Request not found.");

      const isProfessional = accountType === "professional";
      const online = Boolean(backendUserId) && isAppBackendOnline();
      const isAccept = status === "accepted" && existing.status === "pending";
      let warning: string | null = null;

      if (isAccept) {
        const lock = isProfessional
          ? skillLockBlock({ request: existing, registeredAs, proServices })
          : null;
        if (lock) return fail(lock.code, lock.message);
        const gate = verificationGate({ profile: userProfile, isProfessional });
        if (!gate.allowed) return fail("verification_required", gate.message);
        // Accepting is the SSPE Open/Confirm flow, not a status write.
        if (online) return fail("use_job_flow", ACCEPT_VIA_JOB_FLOW_MESSAGE);
        warning = gate.warning;
      }

      // Server first: never show a status the server has not accepted.
      if (online && backendUserId) {
        const res = await advanceDeskRequest({
          jobId: id,
          userId: backendUserId,
          role: deskRoleFor(existing, backendUserId),
          from: existing.status,
          to: status,
        });
        if (!res.ok) return fail("transition_failed", res.message);
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      if (isAccept && userProfile) {
        persistProfile({
          ...userProfile,
          serviceActionCount: count + 1,
          firstServiceAt:
            userProfile.firstServiceAt || new Date().toISOString(),
        });
      }
      return { ok: true, warning, actionCount: isAccept ? count + 1 : count };
    },
    [
      requests,
      userProfile,
      accountType,
      persistProfile,
      registeredAs,
      proServices,
      backendUserId,
      setRequests,
    ],
  );
  return {
    updateRequestStatus,
  };
}

export type RequestStatusResult = ReturnType<typeof useRequestStatus>;
