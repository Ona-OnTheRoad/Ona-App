"use client";

import type { AccountType, ServiceRequest } from "@/lib/types";
import type { DiagnosticContext } from "@/lib/jobs/diagnostics/types";

/** Strict read for reconciliation: an unavailable list is not an empty list. */
export async function readRequestSnapshot(userId: string, role: AccountType,
  diagnostic?: DiagnosticContext): Promise<ServiceRequest[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const qs = new URLSearchParams({ userId, role });
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch(`/api/requests?${qs.toString()}`, {
      method: "GET", cache: "no-store", signal: controller.signal,
    }, diagnostic);
    const json = await res.json() as {
      ok?: boolean; data?: { requests?: ServiceRequest[] }; error?: { message?: string };
    };
    if (!res.ok || !json?.ok || !Array.isArray(json.data?.requests)) {
      throw new Error(json?.error?.message || "Could not refresh requests");
    }
    return json.data.requests;
  } finally { clearTimeout(timer); }
}
