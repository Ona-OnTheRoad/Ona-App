import "server-only";

export type SmsMessage = {
  /** E.164 phone number, e.g. +2348012345678 */
  to: string;
  message: string;
};

export type SmsProviderResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

/** One SMS gateway. Adapters never throw; they return `{ ok: false }`. */
export type SmsProvider = {
  name: string;
  isConfigured(): boolean;
  send(input: SmsMessage): Promise<SmsProviderResult>;
};

export type SmsAttempt = { provider: string; error: string };

export type SmsSendResult =
  | { ok: true; provider: string; messageId?: string; attempts: SmsAttempt[] }
  | { ok: false; error: string; attempts: SmsAttempt[] };
