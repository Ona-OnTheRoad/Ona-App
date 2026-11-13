import "server-only";
import { normalizeNgPhone } from "@/lib/server/africastalking";
import { SMS_PROVIDERS } from "@/lib/server/sms/providers";
import type {
  SmsAttempt,
  SmsMessage,
  SmsProvider,
  SmsSendResult,
} from "@/lib/server/sms/types";

/**
 * Configured providers in the order to try them. `SMS_PROVIDER_ORDER` is a
 * comma-separated list of adapter names; unknown names are ignored and
 * adapters left out of the list are not used. Unset means the default order.
 */
export function orderedSmsProviders(
  all: SmsProvider[] = SMS_PROVIDERS,
  order: string | undefined = process.env.SMS_PROVIDER_ORDER,
): SmsProvider[] {
  const names = String(order ?? "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
  const picked = names.length
    ? [...new Set(names)]
        .map((n) => all.find((p) => p.name === n))
        .filter((p): p is SmsProvider => Boolean(p))
    : all;
  return picked.filter((p) => p.isConfigured());
}

export function isSmsConfigured(): boolean {
  return orderedSmsProviders().length > 0;
}

/**
 * Send one SMS, falling over to the next configured provider when a send
 * fails. Never throws. `providers` is injectable for tests.
 */
export async function sendSms(
  input: SmsMessage,
  providers: SmsProvider[] = orderedSmsProviders(),
): Promise<SmsSendResult> {
  const to = normalizeNgPhone(input.to);
  if (!to) return { ok: false, error: "Invalid phone number", attempts: [] };
  if (providers.length === 0) {
    return { ok: false, error: "No SMS provider is configured", attempts: [] };
  }

  const attempts: SmsAttempt[] = [];
  for (const provider of providers) {
    let error: string;
    try {
      const result = await provider.send({ to, message: input.message });
      if (result.ok) {
        if (attempts.length > 0) {
          // Provider names only: never log the number or the message.
          console.warn(
            `[sms] delivered by ${provider.name} after ${attempts.map((a) => a.provider).join(", ")} failed`,
          );
        }
        return { ok: true, provider: provider.name, messageId: result.messageId, attempts };
      }
      error = result.error;
    } catch (e) {
      error = e instanceof Error ? e.message : "SMS provider error";
    }
    attempts.push({ provider: provider.name, error });
  }
  return {
    ok: false,
    error: attempts.map((a) => `${a.provider}: ${a.error}`).join("; "),
    attempts,
  };
}
