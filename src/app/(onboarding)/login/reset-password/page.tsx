"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OnaField, OnaPasswordInput } from "@/components/ui/ona-field";
import { OnaRuleList } from "@/components/ui/ona-rule-list";
import { passwordChecklist, passwordError } from "@/lib/signup-validation";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { FeedbackLines } from "@/components/auth/sign-in-form/feedback-lines";

/**
 * Landing page from Supabase recovery email.
 * Tokens arrive in the URL hash: #access_token=…&refresh_token=…&type=recovery
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const access = params.get("access_token") || "";
      const refresh = params.get("refresh_token") || "";
      const type = params.get("type") || "";
      if (access && refresh) {
        setAccessToken(access);
        setRefreshToken(refresh);
        setReady(true);
        if (type && type !== "recovery") {
          setInfo("You can set a new password for this account.");
        }
      } else {
        setError(
          "This reset link is invalid or incomplete. Request a new one from Log In → Forgot password.",
        );
      }
    } catch {
      setError("Could not read reset link.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const policyErr = passwordError(password);
    if (policyErr) {
      setError(policyErr);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!accessToken || !refreshToken) {
      setError("Missing reset session. Request a new link.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          password,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setError(json?.error?.message || "Could not update password.");
        return;
      }
      setInfo("Password updated. Redirecting to log in…");
      window.setTimeout(() => router.replace("/login/signin"), 1200);
    } finally {
      setBusy(false);
    }
  }

  // Same policy as signup (passwordChecklist) plus the match check onSubmit runs.
  const rules = [
    ...passwordChecklist(password),
    {
      ok: confirm.length > 0 && password === confirm,
      text: "Both passwords match",
    },
  ];

  return (
    <OnaScreen
      wordmark
      onBack={() => router.push("/login/signin")}
      backLabel="Back to log in"
    >
      <OnaTitle
        className="pt-5"
        title="Create a new password"
        subtitle="Choose a new password for your Ona account."
      />
      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <OnaField label="New password" required>
          {({ id, describedBy }) => (
            <OnaPasswordInput
              id={id}
              aria-describedby={describedBy}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              disabled={!ready}
            />
          )}
        </OnaField>
        <OnaRuleList title="Password requirements:" rules={rules} />
        <OnaField label="Confirm password" required>
          {({ id, describedBy }) => (
            <OnaPasswordInput
              id={id}
              aria-describedby={describedBy}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              required
              disabled={!ready}
            />
          )}
        </OnaField>
        <FeedbackLines info={info} error={error} />
        <Button
          size="ona"
          variant="ona"
          type="submit"
          busy={busy}
          busyLabel="Saving…"
          disabled={!ready}
          className="mt-2"
        >
          Update password
        </Button>
      </form>
    </OnaScreen>
  );
}
