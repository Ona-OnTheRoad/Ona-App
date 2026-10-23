"use client";

import { CUSTOMER_PHONE_OTP } from "@/lib/verification-gate";
import { cn } from "@/lib/utils";
import { authenticatorQrUrl, type SetupStep } from "./two-fa-utils";

type Common = {
  isLight?: boolean;
  ink?: string;
  muted?: string;
  phone?: string;
  setupErr: string | null;
  setSetupErr: (v: string | null) => void;
  setSetupStep: (s: SetupStep) => void;
};

export function PickMethodPanel({
  phone,
  setSetupStep,
  setSmsSent,
  setSetupErr,
  onCancel,
}: Omit<Common, "setupErr"> & {
  setSmsSent: (v: boolean) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2.5 pt-1">
      <p className="text-[13px] font-medium text-ona-ink">Choose a method</p>

      <button
        type="button"
        onClick={() => {
          setSetupStep("sms");
          setSmsSent(false);
          setSetupErr(null);
        }}
        className="flex w-full flex-col items-start rounded-ona-ctl border border-ona-border bg-ona-field hover:bg-ona-field-strong px-3.5 py-2.5 text-left transition-colors cursor-pointer"
      >
        <span className="text-[13px] font-medium text-ona-ink">SMS code</span>
        <span className="text-[11px] font-normal text-ona-muted mt-0.5">
          Codes sent to {phone || "your phone"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setSetupStep("authenticator");
          setSetupErr(null);
        }}
        className="flex w-full flex-col items-start rounded-ona-ctl border border-ona-border bg-ona-field hover:bg-ona-field-strong px-3.5 py-2.5 text-left transition-colors cursor-pointer"
      >
        <span className="text-[13px] font-medium text-ona-ink">
          Authenticator app
        </span>
        <span className="text-[11px] font-normal text-ona-muted mt-0.5">
          Google Authenticator, Authy, or similar
        </span>
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full h-10 flex items-center justify-center rounded-ona-ctl border border-ona-border bg-transparent text-[13px] font-medium text-ona-muted hover:text-ona-ink hover:bg-ona-field transition-colors cursor-pointer mt-1"
      >
        Cancel
      </button>
    </div>
  );
}

export function SmsPanel({
  phone,
  setupErr,
  setSetupErr,
  setSetupStep,
  smsSent,
  setSmsSent,
  smsCode,
  setSmsCode,
  verifySms,
}: Common & {
  smsSent: boolean;
  setSmsSent: (v: boolean) => void;
  smsCode: string;
  setSmsCode: (v: string) => void;
  verifySms: () => void;
}) {
  return (
    <div className="space-y-3 pt-1">
      <div>
        <p className="text-[13px] font-medium text-ona-ink">Verify SMS</p>
        <p className="text-[11px] font-normal text-ona-muted mt-0.5">
          We will text a 6-digit code to {phone || "your number"}
        </p>
      </div>

      {!smsSent ? (
        <button
          type="button"
          onClick={() => setSmsSent(true)}
          className="h-11 w-full rounded-ona-ctl bg-brand text-white font-medium text-[13px] transition-opacity hover:opacity-95 active:opacity-85 cursor-pointer"
        >
          Send code
        </button>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Code sent (demo: {CUSTOMER_PHONE_OTP})
          </p>
          <input
            className="h-11 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 text-[13px] font-normal text-ona-ink outline-none transition-colors placeholder:text-ona-muted/60 focus:border-ona-ink"
            inputMode="numeric"
            maxLength={6}
            value={smsCode}
            onChange={(e) =>
              setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit code"
          />
          {setupErr ? (
            <p className="text-[11px] font-medium text-red-500">{setupErr}</p>
          ) : null}
          <button
            type="button"
            onClick={verifySms}
            className="h-11 w-full rounded-ona-ctl bg-brand text-white font-medium text-[13px] transition-opacity hover:opacity-95 active:opacity-85 cursor-pointer"
          >
            Enable SMS 2FA
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setSetupStep("pick");
          setSetupErr(null);
        }}
        className="w-full py-1 text-[12px] font-medium text-ona-muted hover:text-ona-ink transition-colors cursor-pointer text-center"
      >
        Back to methods
      </button>
    </div>
  );
}

export function AuthenticatorPanel({
  setupErr,
  setSetupErr,
  setSetupStep,
  secret,
  email,
  authCode,
  setAuthCode,
  verifyAuth,
}: Omit<Common, "phone"> & {
  secret: string;
  email: string;
  authCode: string;
  setAuthCode: (v: string) => void;
  verifyAuth: () => void;
}) {
  return (
    <div className="space-y-3 pt-1">
      <div>
        <p className="text-[13px] font-medium text-ona-ink">
          Authenticator setup
        </p>
        <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-relaxed">
          Open Google Authenticator, Authy, or similar and scan the QR or enter
          the secret manually.
        </p>
      </div>

      {secret ? (
        <div className="flex flex-col items-center gap-2 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={authenticatorQrUrl(secret, email)}
            alt="Authenticator QR code"
            width={160}
            height={160}
            className="rounded-ona-ctl bg-white p-2 border border-ona-border"
            loading="lazy"
          />
          <p className="text-[10px] font-normal text-ona-muted">
            Scan with your authenticator app
          </p>
        </div>
      ) : null}

      <div className="rounded-ona-ctl border border-ona-border bg-ona-field px-3 py-2 font-mono text-[12px] font-medium text-ona-ink tracking-wider break-all text-center">
        {secret || "Not set"}
      </div>

      <div className="space-y-2.5">
        <input
          className="h-11 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 text-[13px] font-normal text-ona-ink outline-none transition-colors placeholder:text-ona-muted/60 focus:border-ona-ink"
          inputMode="numeric"
          maxLength={6}
          value={authCode}
          onChange={(e) =>
            setAuthCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="Enter 6-digit code from app"
        />
        {setupErr ? (
          <p className="text-[11px] font-medium text-red-500">{setupErr}</p>
        ) : null}
        <button
          type="button"
          onClick={verifyAuth}
          className="h-11 w-full rounded-ona-ctl bg-brand text-white font-medium text-[13px] transition-opacity hover:opacity-95 active:opacity-85 cursor-pointer"
        >
          Enable authenticator 2FA
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setSetupStep("pick");
          setSetupErr(null);
        }}
        className="w-full py-1 text-[12px] font-medium text-ona-muted hover:text-ona-ink transition-colors cursor-pointer text-center"
      >
        Back to methods
      </button>
    </div>
  );
}
