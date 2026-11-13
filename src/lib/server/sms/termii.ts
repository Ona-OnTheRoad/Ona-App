import "server-only";
import type { SmsMessage, SmsProvider, SmsProviderResult } from "@/lib/server/sms/types";

/**
 * Termii SMS adapter (second provider, used for failover).
 * Docs: "Send Message" — POST {BASE_URL}/api/sms/send
 *
 * Env (all three required; the adapter is off otherwise):
 * TERMII_API_KEY    from the Termii dashboard
 * TERMII_SENDER_ID  approved alphanumeric sender ID (3-11 characters)
 * TERMII_BASE_URL   the account's API base URL shown on the dashboard
 * TERMII_CHANNEL    optional: generic (default) | dnd
 */
function config() {
  const apiKey = process.env.TERMII_API_KEY?.trim() || "";
  const senderId = process.env.TERMII_SENDER_ID?.trim() || "";
  const baseUrl = (process.env.TERMII_BASE_URL?.trim() || "").replace(/\/$/, "");
  const channel = process.env.TERMII_CHANNEL?.trim() || "generic";
  return { apiKey, senderId, baseUrl, channel };
}

export function isTermiiConfigured(): boolean {
  const { apiKey, senderId, baseUrl } = config();
  return Boolean(apiKey && senderId && baseUrl);
}

export async function sendTermiiSms(input: SmsMessage): Promise<SmsProviderResult> {
  const { apiKey, senderId, baseUrl, channel } = config();
  if (!apiKey || !senderId || !baseUrl) {
    return { ok: false, error: "Termii is not configured" };
  }
  try {
    const res = await fetch(`${baseUrl}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        // International format without the leading "+".
        to: input.to.replace(/\D/g, ""),
        from: senderId,
        sms: input.message,
        type: "plain",
        channel,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      message_id?: string | number;
      message_id_str?: string;
      message?: string;
    };
    const messageId = json.message_id_str || (json.message_id != null ? String(json.message_id) : "");
    if (!res.ok || !messageId) {
      return { ok: false, error: json.message || `Termii HTTP ${res.status}` };
    }
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Termii network error" };
  }
}

export const termiiProvider: SmsProvider = {
  name: "termii",
  isConfigured: isTermiiConfigured,
  send: sendTermiiSms,
};
