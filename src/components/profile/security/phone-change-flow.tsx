"use client";

import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";
import { SecurityField } from "./security-field";
import {
  backendSendOtp,
  backendProfileVerifyOtp,
} from "@/lib/supabase/app-api";
import { ChangeFlowHeader } from "./shared/change-flow-header";
import { DiscardChangesSheet } from "./shared/discard-sheet";
import { changeFlowFieldClass } from "./shared/field-class";
import { OtpCodeStep } from "./shared/otp-code-step";
import { useIdentityVerification } from "./shared/use-identity-verification";
import { VerifyIdentityStep } from "./shared/verify-identity-step";

interface PhoneChangeFlowProps {
  isLight: boolean;
  currentPhone: string;
  currentEmail: string;
  isPhoneVerified: boolean;
  guarantorName?: string;
  accessToken: string;
  onPhoneChanged: (newPhone: string) => void;
}

type Step =
  | "idle"
  | "verify_identity"
  | "enter_new"
  | "send_new_otp"
  | "verify_new"
  | "confirming"
  | "done"
  | "error";

export function PhoneChangeFlow({
  isLight,
  currentPhone,
  currentEmail,
  isPhoneVerified,
  guarantorName,
  accessToken,
  onPhoneChanged,
}: PhoneChangeFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [newPhone, setNewPhone] = useState("");
  const [newCode, setNewCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const t = profileTheme(isLight);

  const hasGuarantor = !!guarantorName;

  // Identity verification fields
  const identity = useIdentityVerification({
    currentEmail,
    accessToken,
    hasGuarantor,
    verifiedMessage: "Identity verified. Enter your new phone number.",
    setBusy,
    setErr,
    setMsg,
    onVerified: () => setStep("enter_new"),
  });

  if (!open) {
    return (
      <SecurityField
        isLight={isLight}
        label="Phone number"
        value={currentPhone}
        badge={isPhoneVerified ? "verified" : undefined}
        onChangeClick={() => {
          setOpen(true);
          setStep("verify_identity");
          setMsg(null);
          setErr(null);
          identity.resetIdentity();
        }}
      />
    );
  }

  const sendNewOtp = async () => {
    const cleaned = newPhone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setErr("Enter a valid phone number");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await backendSendOtp({ channel: "phone", target: newPhone });
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setStep("verify_new");
    setMsg("Code sent to your new phone.");
  };

  const verifyNew = async () => {
    if (newCode.length < 4) {
      setErr("Enter the code");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await backendProfileVerifyOtp({
      channel: "phone",
      target: newPhone,
      code: newCode,
    });
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setStep("confirming");
    await doChange();
  };

  const doChange = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await (
        await import("@/lib/api-auth-headers")
      ).authFetch("/api/security/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_phone",
          accessToken,
          newValue: newPhone,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };
      if (!json?.ok) {
        setErr(json?.error?.message || "Phone update failed.");
        setStep("error");
        return;
      }
      setStep("done");
      setMsg("Phone number updated.");
      onPhoneChanged(newPhone);
    } catch {
      setErr("Network error. Try again.");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setOpen(false);
    setStep("idle");
    setNewPhone("");
    setNewCode("");
    identity.resetIdentity();
    setMsg(null);
    setErr(null);
  };

  const fieldClass = changeFlowFieldClass(isLight);

  return (
    <div className="space-y-3">
      <ChangeFlowHeader
        isLight={isLight}
        label="Phone number"
        value={step === "done" ? newPhone : currentPhone}
        done={step === "done"}
        onDone={reset}
        onCancel={() => setConfirmCancel(true)}
      />

      {step === "verify_identity" && (
        <VerifyIdentityStep
          isLight={isLight}
          changeWhat="phone number"
          hasGuarantor={hasGuarantor}
          busy={busy}
          password={identity.password}
          onPassword={identity.setPassword}
          emailCode={identity.emailCode}
          onEmailCode={identity.setEmailCode}
          emailCodeSent={identity.emailCodeSent}
          onSendEmailOtp={identity.sendEmailOtp}
          gName={identity.gName}
          onGName={identity.setGName}
          onVerify={identity.verifyIdentity}
        />
      )}

      {step === "enter_new" && (
        <div className="space-y-2">
          <p className={cn("text-[12px]", t.muted)}>
            Enter your new phone number.
          </p>
          <input
            className={fieldClass}
            placeholder="+234 801 234 5678"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || newPhone.replace(/\D/g, "").length < 10}
            onClick={sendNewOtp}
            className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send code to new number"}
          </button>
        </div>
      )}

      {step === "verify_new" && (
        <OtpCodeStep
          isLight={isLight}
          prompt="Enter the 6-digit code sent to your new number."
          value={newCode}
          onChange={setNewCode}
          busy={busy}
          onVerify={verifyNew}
        />
      )}

      {step === "confirming" && (
        <p className={cn("text-[12px]", t.muted)}>
          Updating your phone number…
        </p>
      )}

      {step === "done" && (
        <p className={cn("text-[12px] font-medium", t.soft)}>
          Your phone number has been updated.
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
