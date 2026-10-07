import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Flutterwave v3 contract: verif-hash equals the dashboard's dedicated secret hash. */
export function authenticateFlutterwaveWebhook(headers: Headers): boolean {
  const secret = (process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || "").trim();
  const received = headers.get("verif-hash");
  if (!secret || !received) return false;
  const expectedBytes = Buffer.from(secret);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}
