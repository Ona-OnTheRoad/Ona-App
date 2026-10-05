import { useState } from "react";
import { backendSendOtp } from "@/lib/supabase/app-api";

type Params = {
  currentEmail: string;
  accessToken: string;
  hasGuarantor: boolean;
  /** Banner message shown once identity is verified. */
  verifiedMessage: string;
  setBusy: (b: boolean) => void;
  setErr: (s: string | null) => void;
  setMsg: (s: string | null) => void;
  /** Called after the server confirms identity (advance the flow step). */
  onVerified: () => void;
};

/** Identity-check state + handlers shared by the phone and email flows. */
export function useIdentityVerification({
  currentEmail,
  accessToken,
  hasGuarantor,
  verifiedMessage,
  setBusy,
  setErr,
  setMsg,
  onVerified,
}: Params) {
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [gName, setGName] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const resetIdentity = () => {
    setPassword("");
    setEmailCode("");
    setGName("");
    setEmailCodeSent(false);
  };

  const sendEmailOtp = async () => {
    setBusy(true);
    setErr(null);
    const res = await backendSendOtp({
      channel: "email",
      target: currentEmail,
    });
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setEmailCodeSent(true);
    setMsg("Code sent to your email.");
  };

  const verifyIdentity = async () => {
    if (!password) {
      setErr("Enter your current password.");
      return;
    }
    if (!emailCode) {
      setErr("Enter the code sent to your email.");
      return;
    }
    if (hasGuarantor && !gName.trim()) {
      setErr("Enter your guarantor's full name.");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const res = await (
        await import("@/lib/api-auth-headers")
      ).authFetch("/api/security/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          password,
          emailCode,
          ...(hasGuarantor && { guarantorName: gName.trim() }),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };
      if (!json?.ok) {
        setErr(json?.error?.message || "Identity verification failed.");
        return;
      }
      onVerified();
      setMsg(verifiedMessage);
      setPassword("");
      setEmailCode("");
      setGName("");
    } catch {
      setErr("Network error during verification.");
    } finally {
      setBusy(false);
    }
  };

  return {
    password,
    setPassword,
    emailCode,
    setEmailCode,
    gName,
    setGName,
    emailCodeSent,
    resetIdentity,
    sendEmailOtp,
    verifyIdentity,
  };
}
