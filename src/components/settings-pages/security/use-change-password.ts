"use client";

import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { useState } from "react";
import { passwordError, passwordRules } from "@/lib/signup-validation";
import { useApp } from "@/lib/store";

export function useChangePassword() {
  const { userProfile, updateUserProfile } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");
  const [busy, setBusy] = useState(false);

  const rules = passwordRules(next);

  const changePassword = () => {
    setErr(null);
    setMsg(null);
    if (!userProfile) {
      setErr("Sign in first");
      return;
    }
    if (!current) {
      setErr("Enter your current password");
      return;
    }
    if (userProfile.password && current !== userProfile.password) {
      setErr("Current password is incorrect");
      return;
    }
    const pe = passwordError(next);
    if (pe) {
      setErr(pe.replace(/\.$/, ""));
      return;
    }
    if (next !== confirm) {
      setErr("New passwords do not match");
      return;
    }
    setBusy(true);
    const e = updateUserProfile({ password: next });
    setBusy(false);
    if (e) setErr(e.replace(/\.$/, ""));
    else {
      setMsg("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return {
    current,
    setCurrent,
    next,
    setNext,
    confirm,
    setConfirm,
    msg,
    err,
    busy,
    rules,
    changePassword,
  };
}
