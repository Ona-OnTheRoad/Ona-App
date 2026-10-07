import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { confirmJobPayment } from "@/lib/server/payments/confirm-job-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reference: z.string().min(3).optional(),
  /** Flutterwave also sends transaction_id */
  transactionId: z.union([z.string(), z.number()]).optional(),
  jobId: z.string().optional(),
  provider: z.enum(["paystack", "flutterwave", "mock"]).optional(),
});

/** Verify gateway charge, mark escrow held, job → Booked. */
export async function POST(req: Request) {
  try {
    // Soft rate-limit (verify is called from payment callback; gateway is source of truth)
    try {
      const { rateLimit } = await import("@/lib/server/modules/rate-limit");
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const rl = rateLimit({
        key: `pay-verify:${ip}`,
        limit: 30,
        windowMs: 60_000,
      });
      if (!rl.ok) {
        return apiFail(
          `Too many verify attempts. Retry in ${rl.retryAfterSec}s.`,
          429,
          "rate_limited",
        );
      }
    } catch {
      /* non-fatal */
    }

    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return apiFail("Invalid body", 400);

    const refRaw = (parsed.data.reference || "").trim();
    if (!refRaw && !parsed.data.jobId) {
      return apiFail("reference or jobId required", 400);
    }

    // Provider and transactionId are legacy callback hints, never authority.
    const result = await confirmJobPayment({
      reference: refRaw || undefined, jobId: parsed.data.jobId, motoristId: auth.userId,
    });
    if (result.outcome === "pending" || result.outcome === "rejected") {
      if (result.code === "forbidden") return apiFail(result.message, 403, "forbidden");
      const notFound = result.code === "not_found";
      return apiFail(result.message, notFound ? 404 : result.retryable ? 503 : 402,
        notFound ? "not_found" : "verify_failed");
    }
    const { payment, job } = result;
    if (result.outcome === "already_confirmed") {
      return apiOk({ payment, alreadySettled: true, job });
    }

    return apiOk({
      payment,
      job,
      jobError: null,
      receipt: {
        reference: payment.providerRef,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        labourOnly: true,
        discountPercent: payment.discountPercent,
        platformFeeMinor: payment.platformFeeMinor,
        proPayoutMinor: payment.proPayoutMinor,
        status: "held",
        message:
          "Funds held in escrow. Job is Booked. Released when both parties mark the job complete.",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verify failed";
    return apiFail(msg, 500);
  }
}
