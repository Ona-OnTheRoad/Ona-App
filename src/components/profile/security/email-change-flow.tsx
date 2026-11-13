"use client";

import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";
import { SecurityField } from "./security-field";
import {
  CODE_STEP_ERRORS,
  sendChangeContactCode,
} from "@/lib/security/change-contact-client";
import { ChangeFlowHeader } from "./shared/change-flow-header";
import { DiscardChangesSheet } from "./shared/discard-sheet";
import { changeFlowFieldClass } from "./shared/field-class";
import { OtpCodeStep } from "./shared/otp-code-step";
import { useIdentityVerification } from "./shared/use-identity-verification";
import { VerifyIdentityStep } from "./shared/verify-identity-step";

interface EmailChangeFlowProps {
  isLight: boolean;
  currentEmail: string;
  isEmailVerified: boolean;
  guarantorName?: string;
  accessToken: string;
  onEmailChanged: (newEmail: string) => void;
}

type Step =
  | "idle"
  | "verify_identity"
  | "enter_new"
  | "verify_new"
  | "confirming"
  | "done"
  | "error";

export function EmailChangeFlow({
  isLight,
  currentEmail,
  isEmailVerified,
  guarantorName,
  accessToken,
  onEmailChanged,
}: EmailChangeFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [newEmail, setNewEmail] = useState("");
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
    verifiedMessage: "Identity verified. Enter your new email address.",
    setBusy,
    setErr,
    setMsg,
    onVerified: () => setStep("enter_new"),
  });

  if (!open) {
    return (
      <SecurityField
        isLight={isLight}
        label="Email"
        value={currentEmail}
        badge={isEmailVerified ? "verified" : undefined}
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
    const email = newEmail.trim().toLowerCase();
    if (!email.includes("@") || !email.includes(".")) {
      setErr("Enter a valid email address");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await sendChangeContactCode({
      channel: "email",
      target: email,
      identityProof: identity.identityProof,
    });
    setBusy(false);
    if (!res.ok) {
      if (res.code === "identity_required") {
        // The identity proof expired (or was never issued): start that step again.
        identity.resetIdentity();
        setStep("verify_identity");
      }
      setErr(res.error);
      return;
    }
    setNewCode("");
    setStep("verify_new");
    setMsg("Code sent to your new email.");
  };

  // The code is checked by the server together with the change itself, so there
  // is no separate "verify" call that the browser could skip or fake.
  const verifyNew = async () => {
    if (newCode.length < 4) {
      setErr("Enter the code");
      return;
    }
    await doChange(newEmail.trim().toLowerCase(), newCode);
  };

  const doChange = async (email: string, code: string) => {
    setBusy(true);
    setErr(null);
    setStep("confirming");
    try {
      const res = await (
        await import("@/lib/api-auth-headers")
      ).authFetch("/api/security/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_email",
          accessToken,
          newValue: email,
          code,
          identityProof: identity.identityProof,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: { message?: string; code?: string };
      };
      if (!json?.ok) {
        const errCode = json?.error?.code || "";
        setErr(json?.error?.message || "Email update failed.");
        if (errCode === "identity_required") {
          identity.resetIdentity();
          setStep("verify_identity");
        } else if (CODE_STEP_ERRORS.has(errCode)) {
          setNewCode("");
          setStep("verify_new");
        } else {
          setStep("error");
        }
        return;
      }
      setStep("done");
      setMsg("Email address updated.");
      onEmailChanged(email);
    } catch {
      setErr("Network error. Try again.");
      setStep("verify_new");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setOpen(false);
    setStep("idle");
    setNewEmail("");
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
        label="Email"
        value={step === "done" ? newEmail : currentEmail}
        done={step === "done"}
        onDone={reset}
        onCancel={() => setConfirmCancel(true)}
      />

      {step === "verify_identity" && (
        <VerifyIdentityStep
          isLight={isLight}
          changeWhat="email address"
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
            Enter your new email address.
          </p>
          <input
            className={fieldClass}
            placeholder="new@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !newEmail.trim().includes("@")}
            onClick={sendNewOtp}
            className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send code to new email"}
          </button>
        </div>
      )}

      {step === "verify_new" && (
        <OtpCodeStep
          isLight={isLight}
          prompt="Enter the 6-digit code sent to your new email."
          value={newCode}
          onChange={setNewCode}
          busy={busy}
          onVerify={verifyNew}
        />
      )}

      {step === "verify_new" && (
        <button
          type="button"
          disabled={busy}
          onClick={sendNewOtp}
          className={cn("text-[12px] font-medium underline disabled:opacity-50", t.muted)}
        >
          Resend code
        </button>
      )}

      {step === "confirming" && (
        <p className={cn("text-[12px]", t.muted)}>
          Updating your email address…
        </p>
      )}

      {step === "done" && (
        <p className={cn("text-[12px] font-medium", t.soft)}>
          Your email address has been updated.
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
