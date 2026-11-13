import "server-only";
import { isDemoOtpAllowed } from "@/lib/auth/demo-otp";
import { isResendConfigured, sendResendEmail } from "@/lib/server/resend";
import { buildOtpMessage } from "@/lib/server/africastalking";
import { isSmsConfigured, sendSms } from "@/lib/server/sms/send";

export type OtpChannel = "phone" | "email";

/** Stable strings: the send route maps them to HTTP status and error code. */
export const OTP_DELIVERY_FAILED_MESSAGE =
  "We could not send your code. Please try again shortly.";
export const OTP_DELIVERY_UNAVAILABLE_MESSAGE =
  "Code delivery is not available right now. Please try another sign-in method.";

export type OtpDeliveryPlan =
  /** A real provider is configured: issue a random code and send it. */
  | { kind: "real" }
  /** No provider, demo mode on: store the demo code, send nothing. */
  | { kind: "demo" }
  /** No provider and no demo mode: nothing could reach the user. */
  | { kind: "unavailable" };

export function planOtpDelivery(channel: OtpChannel): OtpDeliveryPlan {
  const configured =
    channel === "phone" ? isSmsConfigured() : isResendConfigured();
  if (configured) return { kind: "real" };
  return isDemoOtpAllowed() ? { kind: "demo" } : { kind: "unavailable" };
}

export function loginOtpSmsText(code: string): string {
  return `Ona login code: ${code}. Valid for 10 minutes. Do not share this code.`;
}

async function sendLoginOtpEmail(input: {
  to: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = `Your Ona login code is ${input.code}. It is valid for 10 minutes. Do not share this code.`;
  const html = `
 <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
 <p style="font-size:14px;line-height:1.5;margin:0 0 12px">Your Ona login code is</p>
 <p style="font-size:28px;font-weight:800;letter-spacing:4px;margin:0 0 12px">${input.code}</p>
 <p style="font-size:12px;color:#64748b;line-height:1.4;margin:0">Valid for 10 minutes. Do not share this code. If you did not ask for it, ignore this email.</p>
 </div>`;
  const sent = await sendResendEmail({
    to: input.to,
    subject: "Your Ona login code",
    html,
    text,
  });
  return sent.ok ? { ok: true } : { ok: false, error: sent.error };
}

/** Send a code through the channel's real provider. Never throws. */
export async function deliverOtp(input: {
  channel: OtpChannel;
  /** E.164 phone, or plain email address (not the `email:` storage key). */
  to: string;
  code: string;
  /**
   * App origin (https://ona.app). When given, the SMS ends with "@host #code"
   * so Chrome's WebOTP can auto-fill the code. Omit it for the plain message.
   */
  origin?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sent =
      input.channel === "phone"
        ? await sendSms({
            to: input.to,
            message: input.origin
              ? buildOtpMessage(input.code, input.origin)
              : loginOtpSmsText(input.code),
          })
        : await sendLoginOtpEmail({ to: input.to, code: input.code });
    return sent.ok ? { ok: true } : { ok: false, error: sent.error };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "OTP delivery error",
    };
  }
}
