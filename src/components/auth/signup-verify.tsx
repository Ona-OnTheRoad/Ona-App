"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { maskPhone } from "@/components/auth/sign-in-form/phone-input";
import { Button } from "@/components/ui/button";
import { OnaOtpInput } from "@/components/ui/ona-otp-input";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import {
  sendSignupPhoneCode,
  verifySignupPhoneCode,
} from "@/lib/auth/signup-otp-client";
import { useResendCountdown } from "@/lib/auth/use-resend-countdown";
import { formatInternationalPhone } from "@/lib/phone-codes";
import {
  loadSignupDraft,
  saveSignupDraft,
  signupHref,
  type SignupDraft,
} from "@/lib/signup-draft";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";

/** A code stays valid this long on the server; never auto-text the same number again inside it. */
const CODE_VALID_MS = 10 * 60 * 1000;
const sentKey = (phone: string) => `ona-signup-otp-sent:${phone}`;

function readSentAt(phone: string): number {
  try {
    return Number(sessionStorage.getItem(sentKey(phone))) || 0;
  } catch {
    return 0;
  }
}
function writeSentAt(phone: string) {
  try {
    sessionStorage.setItem(sentKey(phone), String(Date.now()));
  } catch {
    /* storage blocked: the server cooldown still protects against repeats */
  }
}

type Phase =
  /** First code is being requested. */
  | "sending"
  /** A code is on its way: boxes are live. */
  | "ready"
  /** The first request failed: offer a retry (skipping stays available). */
  | "failed"
  /** The server has no way to send codes (e.g. SMS not configured yet): only Skip. */
  | "unavailable"
  /** Number proven: Continue. */
  | "verified"
  /** The number already has an account: log in or change it. */
  | "blocked";

/**
 * "Verify your number". Texts a code to the number from the signup details and
 * checks it BEFORE the account exists. A correct code stores a signed proof in
 * the signup draft (never a password, never a session); the account is created
 * later with that proof and starts out with the phone already verified.
 *
 * Always skippable: nothing here can block creating an account.
 */
export function SignupVerify() {
  const router = useRouter();
  const { exiting, go } = useAuthNavigate();
  const ref = useSearchParams().get("ref");
  const [draft, setDraft] = useState<SignupDraft | null>(null);
  const [phase, setPhase] = useState<Phase>("sending");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const { left: resendLeft, start: startResend } = useResendCountdown();
  const started = useRef(false);

  const phone = draft
    ? formatInternationalPhone(draft.phoneDial, draft.phoneNational)
    : "";

  const requestCode = useCallback(
    async (isFirst: boolean) => {
      if (!phone) return;
      if (isFirst) setPhase("sending");
      const res = await sendSignupPhoneCode(phone);
      if (res.ok) {
        writeSentAt(phone);
        startResend(res.resendInSec);
        setOtp("");
        setInvalid(false);
        setPhase("ready");
        return;
      }
      if (res.code === "phone_in_use") {
        setPhase("blocked");
        return;
      }
      if (res.code === "sms_unavailable") {
        setPhase("unavailable");
        return;
      }
      if (res.code === "resend_wait") {
        // A code was just sent: keep the boxes, show the timer.
        startResend(res.retryAfterSec ?? 30);
        setPhase("ready");
        toastInfo(res.error);
        return;
      }
      toastError(res.error);
      if (isFirst) setPhase("failed");
    },
    [phone, startResend],
  );

  // Load the draft; no draft means the user skipped the details step.
  useEffect(() => {
    const d = loadSignupDraft();
    if (!d) {
      router.replace(signupHref("/signup", { ref }));
      return;
    }
    setDraft(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Decide once what to show: already proven, a recent code, or request one.
  useEffect(() => {
    if (!draft || !phone || started.current) return;
    started.current = true;
    if (draft.phoneProof && draft.phoneProofFor === phone) {
      setPhase("verified");
      return;
    }
    const sentAt = readSentAt(phone);
    const age = Date.now() - sentAt;
    if (sentAt && age < CODE_VALID_MS) {
      // Came back to this screen: do not text again, keep the timer honest.
      const left = Math.ceil((30_000 - age) / 1000);
      if (left > 0) startResend(left);
      setPhase("ready");
      return;
    }
    void requestCode(true);
  }, [draft, phone, requestCode, startResend]);

  const checkCode = async (code: string) => {
    if (busy || !draft || code.length < 6) return;
    setBusy(true);
    setInvalid(false);
    try {
      const res = await verifySignupPhoneCode(phone, code);
      if (res.ok) {
        const next: SignupDraft = {
          ...draft,
          phoneProof: res.proof,
          phoneProofFor: res.phone,
        };
        saveSignupDraft(next);
        setDraft(next);
        setPhase("verified");
        toastSuccess("Phone number verified.");
        return;
      }
      if (res.code === "phone_in_use") {
        setPhase("blocked");
        return;
      }
      toastError(res.error);
      setInvalid(true);
      setOtp("");
    } finally {
      setBusy(false);
    }
  };

  if (!draft) return <div className="ona2 h-full" aria-busy="true" />;

  const masked = maskPhone(phone);
  const next = () => go(signupHref("/login/role", { ref }));
  const blocked = phase === "blocked";
  const verified = phase === "verified";

  return (
    <OnaScreen
      wordmark
      exiting={exiting}
      onBack={() => go(signupHref("/signup", { ref }))}
      footer={
        blocked ? (
          <Button
            size="ona"
            variant="ona"
            onClick={() => go("/login/signin")}
          >
            Log in
          </Button>
        ) : verified ? (
          <Button size="ona" variant="ona" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button size="ona" variant="onaOutline" onClick={next}>
            Skip for now
          </Button>
        )
      }
    >
      <OnaTitle
        title="Verify your number"
        subtitle={
          verified
            ? `${masked} is verified.`
            : blocked
              ? `${masked} already has an Ona account.`
              : phase === "unavailable"
                ? "Phone verification isn't available right now."
                : `Enter the 6-digit verification code sent to ${masked}`
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        {verified ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-ona-ctl bg-ona-field px-3 py-3 text-[13px] font-medium text-ona-ink"
          >
            <CheckCircle2
              aria-hidden
              className="h-5 w-5 shrink-0 text-ona-success"
              strokeWidth={2.2}
            />
            Your phone is verified. You won&apos;t need to do this again.
          </p>
        ) : blocked ? (
          <div className="flex flex-col gap-3">
            <p
              role="status"
              className="rounded-ona-ctl bg-ona-field px-3 py-2.5 text-[13px] leading-snug text-ona-muted"
            >
              Log in to that account, or go back and use a different number.
            </p>
            <button
              type="button"
              onClick={() => go(signupHref("/signup", { ref }))}
              className="flex min-h-11 items-center self-start border-0 bg-transparent text-[13px] font-medium text-ona-brand-ink underline underline-offset-2"
            >
              Use a different number
            </button>
          </div>
        ) : phase === "unavailable" ? (
          <p
            role="status"
            className="rounded-ona-ctl bg-ona-field px-3 py-2.5 text-[13px] leading-snug text-ona-muted"
          >
            You can create your account now and verify your number later from
            your profile.
          </p>
        ) : phase === "failed" ? (
          <div className="flex flex-col gap-3">
            <p
              role="status"
              className="rounded-ona-ctl bg-ona-field px-3 py-2.5 text-[13px] leading-snug text-ona-muted"
            >
              We couldn&apos;t send a code right now. Try again, or skip and
              verify your number later from your profile.
            </p>
            <Button
              size="ona"
              variant="ona"
              onClick={() => void requestCode(true)}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <OnaOtpInput
              key={phase === "sending" ? "sending" : "ready"}
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (invalid) setInvalid(false);
              }}
              onComplete={(code) => void checkCode(code)}
              disabled={phase === "sending" || busy}
              invalid={invalid}
              label="SMS code"
              autoFocus
            />
            <p className="sr-only" role="status">
              {phase === "sending" ? "Sending your code…" : ""}
            </p>
            <div className="flex min-h-11 items-center justify-between">
              <span className="text-[12px] text-ona-muted">
                {phase === "sending"
                  ? "Sending your code…"
                  : "You can also verify later from your profile."}
              </span>
              <button
                type="button"
                disabled={phase === "sending" || busy || resendLeft > 0}
                onClick={() => void requestCode(false)}
                className="flex min-h-11 items-center border-0 bg-transparent text-[13px] font-medium text-ona-brand-ink underline underline-offset-2 disabled:text-ona-muted disabled:no-underline"
              >
                {resendLeft > 0
                  ? `Resend code (${resendLeft}s)`
                  : "Resend code"}
              </button>
            </div>
          </>
        )}
      </div>
    </OnaScreen>
  );
}
