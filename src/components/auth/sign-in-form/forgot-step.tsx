"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnaField, OnaInput } from "@/components/ui/ona-field";
import { OnaTitle } from "@/components/ui/ona-screen";
import { useT } from "@/lib/i18n";
import { useFeedbackToast } from "@/lib/use-feedback-toast";

/**
 * Asks for the account email and sends the recovery link
 * (POST /api/auth/forgot-password, which always answers generically).
 */
export function ForgotStep({ initialEmail }: { initialEmail: string }) {
  const t = useT();
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  useFeedbackToast(info, error);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInfo("");
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
        data?: { message?: string };
      } | null;
      if (!json?.ok) {
        setError(json?.error?.message || "Could not send the reset link.");
        return;
      }
      setInfo(
        json.data?.message ||
          "If an account exists for this email, a reset link is on its way.",
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <OnaTitle
        className="pt-5"
        title={t("auth.forgotPassword")}
        subtitle="Enter your account email and we will send you a link to set a new password."
      />
      <div className="mt-5 flex flex-col gap-5">
        <OnaField label={t("auth.email")} required>
          {({ id, describedBy, invalid }) => (
            <OnaInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          )}
        </OnaField>
        <Button
          size="ona"
          variant="ona"
          type="submit"
          busy={busy}
          busyLabel={t("auth.pleaseWait")}
        >
          {t("auth.sendResetLink")}
        </Button>
      </div>
    </form>
  );
}
