"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { sendBankChangeCode, verifyBankChangeCode } from "@/lib/security/change-bank-client";
import { OtpCodeStep } from "./otp-code-step";

/**
 * "Verify it's you" step shown before an EXISTING bank account can be changed:
 * sends a code to the phone on the account and, once entered correctly, hands back
 * the server-issued bankProof. Shared by every screen that edits a saved bank.
 */
export function BankVerifyPanel({
  isLight,
  onVerified,
  onCancel,
}: {
  isLight: boolean;
  onVerified: (bankProof: string) => void;
  onCancel?: () => void;
}) {
  const t = profileTheme(isLight);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");

  const send = async () => {
    setBusy(true);
    setErr(null);
    const res = await sendBankChangeCode();
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setCode("");
    setSent(true);
    setMsg("Code sent to your phone for security verification.");
  };

  const verify = async () => {
    if (code.length < 4) {
      setErr("Enter the code");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await verifyBankChangeCode(code);
    setBusy(false);
    if (!res.ok) {
      setCode("");
      setErr(res.error);
      return;
    }
    onVerified(res.bankProof);
  };

  return (
    <div className="space-y-3">
      <p className={cn("text-[13px] font-bold", t.ink)}>Verify it&apos;s you</p>
      <p className={cn("text-[12px]", t.muted)}>
        Changing your bank account needs a security code. We will send one to the phone number on your account.
      </p>
      {!sent ? (
        <button
          type="button"
          disabled={busy}
          onClick={send}
          className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send security code"}
        </button>
      ) : (
        <>
          <OtpCodeStep
            isLight={isLight}
            prompt="Enter the 6-digit code sent to your phone."
            value={code}
            onChange={setCode}
            busy={busy}
            onVerify={verify}
          />
          <button
            type="button"
            disabled={busy}
            onClick={send}
            className={cn("text-[12px] font-medium underline disabled:opacity-50", t.muted)}
          >
            Resend code
          </button>
        </>
      )}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={cn("block text-[12px] font-medium", t.muted)}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
