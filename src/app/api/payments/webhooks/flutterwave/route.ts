import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { authenticateFlutterwaveWebhook } from "@/lib/server/payments/flutterwave-webhook-auth";
import { confirmJobPayment } from "@/lib/server/payments/confirm-job-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  event: z.string(),
  data: z.unknown().optional(),
});

export async function POST(req: Request) {
  if (!authenticateFlutterwaveWebhook(req.headers)) {
    return apiFail("Invalid webhook authentication", 401, "unauthorized");
  }
  try {
    const payload = eventSchema.safeParse(await req.json().catch(() => null));
    if (!payload.success) return apiFail("Invalid webhook payload", 400);
    if (payload.data.event !== "charge.completed") return apiOk({ ignored: true });
    const transaction = z.object({ tx_ref: z.string().min(1) }).safeParse(payload.data.data);
    if (!transaction.success) return apiFail("Missing transaction reference", 400);
    const result = await confirmJobPayment({
      reference: transaction.data.tx_ref, expectedProvider: "flutterwave",
    });
    // Retry provider/database outages and unknown references (notification may precede insert).
    if (result.outcome === "pending" || (result.outcome === "rejected" && result.code === "not_found")) {
      return apiFail(result.message || "Payment pending", 503, "confirmation_pending");
    }
    // Acknowledge permanent mismatches; payload success/amount/currency never prove payment.
    return apiOk({ outcome: result.outcome });
  } catch {
    return apiFail("Webhook processing unavailable", 503, "confirmation_pending");
  }
}
