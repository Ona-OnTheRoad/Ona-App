"use client";

import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";
import { SecurityField } from "./security-field";
import {
  changeBankAccount,
  sendBankChangeCode,
  verifyBankChangeCode,
} from "@/lib/security/change-bank-client";
import { ChangeFlowHeader } from "./shared/change-flow-header";
import { DiscardChangesSheet } from "./shared/discard-sheet";
import { changeFlowFieldClass } from "./shared/field-class";
import { OtpCodeStep } from "./shared/otp-code-step";
import type { BankChangeFlowProps, Step } from "./bank-change-types";

export function BankChangeFlow({
  isLight,
  currentBank,
  accessToken,
  onBankChanged,
}: BankChangeFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [code, setCode] = useState("");
  /** Server-issued proof that the code sent to the phone on the account was entered. */
  const [bankProof, setBankProof] = useState("");
  const [bankName, setBankName] = useState(currentBank?.bankName || "");
  const [accName, setAccName] = useState(currentBank?.bankAccountName || "");
  const [accNumber, setAccNumber] = useState(
    currentBank?.bankAccountNumber || "",
  );
  const [bankCode, setBankCode] = useState(currentBank?.bankCode || "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const t = profileTheme(isLight);

  const displayValue = currentBank?.bankName
    ? `${currentBank.bankName} · ••••${(currentBank.bankAccountNumber || "").slice(-4)}`
    : "Not set";

  if (!open) {
    return (
      <SecurityField
        isLight={isLight}
        label="Payout bank account"
        value={displayValue}
        onChangeClick={() => {
          setOpen(true);
          setStep("send_otp");
          setMsg(null);
          setErr(null);
        }}
      />
    );
  }

  const sendOtp = async () => {
    setBusy(true);
    setErr(null);
    // The server reads the phone number from the account: the browser cannot choose where the code goes.
    const res = await sendBankChangeCode();
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setCode("");
    setStep("verify_otp");
    setMsg("Code sent to your phone for security verification.");
  };

  const verifyOtp = async () => {
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
    setBankProof(res.bankProof);
    setStep("form");
    setMsg("Identity verified. Enter new bank details.");
    setCode("");
  };

  const doChange = async () => {
    if (!bankName.trim()) {
      setErr("Bank name is required");
      return;
    }
    if (!accName.trim()) {
      setErr("Account name is required");
      return;
    }
    const num = accNumber.replace(/\D/g, "");
    if (num.length !== 10) {
      setErr("Account number must be 10 digits");
      return;
    }
    if (!bankCode.trim()) {
      setErr("Bank code is required");
      return;
    }

    setBusy(true);
    setErr(null);
    setStep("confirming");
    const bank = {
      bankName: bankName.trim(),
      bankAccountName: accName.trim(),
      bankAccountNumber: num,
      bankCode: bankCode.trim(),
    };
    const res = await changeBankAccount({ accessToken, bank, bankProof });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      if (res.code === "verification_required") {
        // The proof expired: verify again.
        setBankProof("");
        setStep("send_otp");
      } else {
        // Wrong details (e.g. already used elsewhere) or a network error: keep what was typed.
        setStep("form");
      }
      return;
    }
    setStep("done");
    setMsg("Bank account updated.");
    setBankProof("");
    onBankChanged(bank);
  };

  const reset = () => {
    setOpen(false);
    setStep("idle");
    setCode("");
    setBankProof("");
    setMsg(null);
    setErr(null);
  };

  const fieldClass = changeFlowFieldClass(isLight);

  return (
    <div className="space-y-3">
      <ChangeFlowHeader
        isLight={isLight}
        label="Payout bank account"
        value={
          step === "done"
            ? `${bankName} · ••••${accNumber.slice(-4)}`
            : displayValue
        }
        done={step === "done"}
        onDone={reset}
        onCancel={() => setConfirmCancel(true)}
      />

      {step === "send_otp" && (
        <div className="space-y-2">
          <p className={cn("text-[12px] font-medium", t.ink)}>
            Changing your bank account requires security verification.
          </p>
          <p className={cn("text-[12px]", t.muted)}>
            A code will be sent to your phone.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={sendOtp}
            className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send security code"}
          </button>
        </div>
      )}

      {step === "verify_otp" && (
        <>
          <OtpCodeStep
            isLight={isLight}
            prompt="Enter the 6-digit code sent to your phone."
            value={code}
            onChange={setCode}
            busy={busy}
            onVerify={verifyOtp}
          />
          <button
            type="button"
            disabled={busy}
            onClick={sendOtp}
            className={cn("text-[12px] font-medium underline disabled:opacity-50", t.muted)}
          >
            Resend code
          </button>
        </>
      )}

      {step === "form" && (
        <div className="space-y-2">
          <input
            className={fieldClass}
            placeholder="Bank name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <input
            className={fieldClass}
            placeholder="Account name"
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
          />
          <input
            className={fieldClass}
            placeholder="Account number (10 digits)"
            value={accNumber}
            onChange={(e) =>
              setAccNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            maxLength={10}
          />
          <input
            className={fieldClass}
            placeholder="Bank code / sort code"
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
          />
          <p className={cn("text-[10px] leading-snug", t.muted)}>
            Your identity has been verified. Changing your bank account will be
            audited and you will be notified.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={doChange}
            className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
          >
            {busy ? "Updating…" : "Update bank account"}
          </button>
        </div>
      )}

      {step === "confirming" && (
        <p className={cn("text-[12px]", t.muted)}>
          Updating your bank account…
        </p>
      )}

      {step === "done" && (
        <p className={cn("text-[12px] font-medium", t.soft)}>
          Bank account updated. A security notification has been sent.
        </p>
      )}
      <DiscardChangesSheet
        open={confirmCancel}
        isLight={isLight}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          reset();
        }}
      />
    </div>
  );
}
