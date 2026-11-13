import "server-only";
import { NextResponse } from "next/server";
import { clientIp } from "@/lib/server/modules/security";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";
import {
  ID_LOOKUP_NOT_CONFIGURED,
  type PremblyVerifyResult,
} from "@/lib/server/prembly";

/** Generous on purpose: many users share one carrier NAT address. */
export const ID_LOOKUP_LIMIT = 20;
export const ID_LOOKUP_WINDOW_MS = 10 * 60_000;

/**
 * Per-IP budget for the unauthenticated NIN/BVN lookup routes (signup calls
 * them before a session exists). Returns a response to send, or null to go on.
 */
export async function guardIdLookup(
  req: Request,
  kind: "nin" | "bvn",
): Promise<Response | null> {
  try {
    const budget = await rateLimitAsync({
      key: `id-lookup:${kind}:${clientIp(req)}`,
      limit: ID_LOOKUP_LIMIT,
      windowMs: ID_LOOKUP_WINDOW_MS,
    });
    if (budget.ok) return null;
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        message: `Too many verification attempts. Retry in ${budget.retryAfterSec}s.`,
      },
      { status: 429, headers: { "Retry-After": String(budget.retryAfterSec) } },
    );
  } catch (e) {
    const unavailable = rateLimitUnavailableResponse(e, req);
    if (!unavailable) throw e;
    // Same body shape the lookup client reads (`message` at the top level).
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limit_unavailable",
        message: "Security checks unavailable. Retry shortly.",
      },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }
}

/** 200 verified · 503 lookup not configured · 422 everything else. */
export function idLookupStatus(result: PremblyVerifyResult): number {
  if (result.ok) return 200;
  return result.code === ID_LOOKUP_NOT_CONFIGURED ? 503 : 422;
}
