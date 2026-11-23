import "server-only";
import { formatWait } from "@/lib/format-wait";
import { apiFail } from "@/lib/server/api-json";
import { clientIp } from "@/lib/server/modules/security";
import {
  rateLimitAsync,
  rateLimitUnavailableResponse,
} from "@/lib/server/modules/rate-limit";

/** Each attempt is a paid provider call; a real Pro needs only a few. */
export const LIVENESS_USER_LIMIT = 5;
export const LIVENESS_IP_LIMIT = 20;
export const LIVENESS_WINDOW_MS = 30 * 60_000;

/**
 * Per-user and per-IP budget for /api/liveness/verify. Returns a response to
 * send (429, or 503 when the limiter is down) or null to go on.
 */
export async function guardLivenessAttempt(
  req: Request,
  userId: string,
): Promise<Response | null> {
  try {
    for (const [key, limit] of [
      [`liveness:user:${userId}`, LIVENESS_USER_LIMIT],
      [`liveness:ip:${clientIp(req)}`, LIVENESS_IP_LIMIT],
    ] as const) {
      const budget = await rateLimitAsync({ key, limit, windowMs: LIVENESS_WINDOW_MS });
      if (!budget.ok) {
        const res = apiFail(
          `Too many verification attempts. Try again in ${formatWait(budget.retryAfterSec)}.`,
          429,
          "rate_limited",
        );
        res.headers.set("Retry-After", String(budget.retryAfterSec));
        return res;
      }
    }
    return null;
  } catch (e) {
    const unavailable = rateLimitUnavailableResponse(e, req);
    if (!unavailable) throw e;
    return unavailable;
  }
}
