import { z } from "zod";
import { createHash } from "node:crypto";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { authenticateFlutterwaveWebhook } from "@/lib/server/payments/flutterwave-webhook-auth";
import { enqueuePaymentWebhook, processPaymentWebhookEvent } from "@/lib/server/payments/durable-processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  event: z.string(),
  id: z.union([z.string(), z.number()]).optional(),
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
    const transaction = z.object({
      tx_ref: z.string().min(1),
      id: z.union([z.string(), z.number()]).optional(),
    }).safeParse(payload.data.data);
    if (!transaction.success) return apiFail("Missing transaction reference", 400);
    const eventIdentity = payload.data.id ?? transaction.data.id ?? transaction.data.tx_ref;
    const dedupeKey = createHash("sha256")
      .update(`flutterwave:charge.completed:${String(eventIdentity)}`)
      .digest("hex");
    const inbox = await enqueuePaymentWebhook({
      provider: "flutterwave",
      dedupeKey,
      eventType: payload.data.event,
      providerRef: transaction.data.tx_ref,
      payload: { transactionId: transaction.data.id ? String(transaction.data.id) : null },
    });
    const processed = await processPaymentWebhookEvent(inbox.id);
    if (processed.status === "retry" || processed.status === "pending" || processed.status === "processing") {
      return apiFail("Payment notification is durably queued for retry", 503, "confirmation_pending");
    }
    // Notification fields only identify work. The processor independently verifies the provider obligation.
    return apiOk({ outcome: processed.status, accepted: true });
  } catch {
    return apiFail("Webhook processing unavailable", 503, "confirmation_pending");
  }
}
