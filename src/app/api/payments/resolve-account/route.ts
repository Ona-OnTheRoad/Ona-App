import { checkIpRateLimit } from "@/lib/server/modules/ip-rate-limit";
import { rateLimitAsync, rateLimitUnavailableResponse } from "@/lib/server/modules/rate-limit";
import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { resolveBankAccount } from "@/lib/server/payments/resolve-account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  accountNumber: z.string().min(10).max(12),
  bankCode: z.string().min(1).max(20),
});

/** Anonymous (signup) budget per client IP. */
const ANON_LIMIT = 10;
const ANON_WINDOW_MS = 10 * 60_000;

function tooManyLookups(retryAfterSec: number) {
  const response = apiFail(
    `Too many name lookups. Retry in ${retryAfterSec}s.`,
    429,
    "rate_limited",
  );
  response.headers.set("Retry-After", String(retryAfterSec));
  return response;
}

/**
 * Flutterwave NUBAN resolve returns account holder name like bank apps.
 * POST /api/payments/resolve-account
 * { accountNumber, bankCode }
 * Session optional: the signup bank step calls this before an account exists.
 */
export async function POST(req: Request) {
  try {
    // Signed-in callers get a per-user budget. Signup has no session yet, so
    // anonymous callers are allowed on a tighter per-IP budget; it fails closed
    // because every lookup is a paid provider call.
    const auth = await requireUser(req);
    if (auth.ok) {
      try {
        const rl = await rateLimitAsync({
          key: `resolve-account:${auth.userId}`,
          limit: 20,
          windowMs: 60_000,
        });
        if (!rl.ok) return tooManyLookups(rl.retryAfterSec);
      } catch (error) {
        return rateLimitUnavailableResponse(error, req) || apiFail("Security checks unavailable", 503);
      }
    } else {
      const ipLimit = await checkIpRateLimit(req, {
        name: "resolve-account",
        limit: ANON_LIMIT,
        windowMs: ANON_WINDOW_MS,
      });
      if (!ipLimit.ok) {
        return ipLimit.reason === "limited"
          ? tooManyLookups(ipLimit.retryAfterSec)
          : apiFail("Security checks unavailable", 503, "rate_limit_unavailable");
      }
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiFail("Enter a valid 10-digit account number and bank.", 400);
    }

    const accountNumber = parsed.data.accountNumber.replace(/\D/g, "");
    const bankCode = parsed.data.bankCode.trim();
    if (accountNumber.length !== 10) {
      return apiFail("Account number must be 10 digits.", 400);
    }
    if (!bankCode) {
      return apiFail("Select a bank first.", 400);
    }

    const result = await resolveBankAccount({ accountNumber, bankCode });
    if (result.status === "unavailable") {
      return apiFail(
        result.message,
        503,
        result.code === "no_keys" ? "no_keys" : "resolve_unavailable",
      );
    }
    if (result.status === "not_found") {
      return apiFail(result.message, 400, "resolve_failed");
    }

    return apiOk({
      accountNumber: result.accountNumber,
      accountName: result.accountName,
      bankCode,
    });
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Account lookup failed",
      500,
    );
  }
}
