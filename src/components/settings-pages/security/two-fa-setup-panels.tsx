"use client";

import { settingsInputClass } from "@/components/settings/settings-ui";
import { CUSTOMER_PHONE_OTP } from "@/lib/verification-gate";
import { cn } from "@/lib/utils";
import { authenticatorQrUrl, type SetupStep } from "./two-fa-utils";

type Common = {
  isLight: boolean;
  ink: string;
  muted: string;
  phone?: string;
  setupErr: string | null;
  setSetupErr: (v: string | null) => void;
  setSetupStep: (s: SetupStep) => void;
};

export function PickMethodPanel({
  isLight,
  ink,
  muted,
  phone,
  setSetupErr,
  setSetupStep,
  setSmsSent,
  onCancel,
}: Omit<Common, "setupErr"> & {
  setSmsSent: (v: boolean) => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      <p className={cn("text-[12px] font-semibold", ink)}>Choose a method</p>
      <button
        type="button"
        onClick={() => {
          setSetupStep("sms");
          setSmsSent(false);
          setSetupErr(null);
        }}
        className={cn(
          "flex w-full flex-col items-start rounded-md border-0 px-3 py-2.5 text-left",
          isLight ? "bg-black/[0.06]" : "bg-white/[0.08]",
        )}
      >
        <span className={cn("text-[13px] font-bold", ink)}>SMS code</span>
        <span className={cn("text-[11px] font-medium", muted)}>
          Codes sent to {phone || "your phone"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          setSetupStep("authenticator");
          setSetupErr(null);
        }}
        className={cn(
          "flex w-full flex-col items-start rounded-md border-0 px-3 py-2.5 text-left",
          isLight ? "bg-black/[0.06]" : "bg-white/[0.08]",
        )}
      >
        <span className={cn("text-[13px] font-bold", ink)}>
          Authenticator app
        </span>
        <span className={cn("text-[11px] font-medium", muted)}>
          Google Authenticator, Authy, or similar
        </span>
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={cn(
          "w-full border-0 bg-transparent py-2 text-[12px] font-semibold",
          muted,
        )}
      >
        Cancel
      </button>
    </div>
  );
}

export function SmsPanel({
  isLight,
  ink,
  muted,
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
    <div className="mt-3 space-y-2">
      <p className={cn("text-[12px] font-semibold", ink)}>Verify SMS</p>
      <p className={cn("text-[11px] font-medium", muted)}>
        We will text a 6-digit code to {phone || "your number"}
      </p>
      {!smsSent ? (
        <button
          type="button"
          onClick={() => setSmsSent(true)}
          className="flex h-10 w-full items-center justify-center rounded-md border-0 bg-[#323231] text-[12px] font-bold text-white"
        >
          Send code
        </button>
      ) : (
        <>
          <p className="text-[11px] font-medium text-emerald-600">
            Code sent (demo {CUSTOMER_PHONE_OTP})
          </p>
          <input
            className={settingsInputClass(isLight)}
            inputMode="numeric"
            maxLength={6}
            value={smsCode}
            onChange={(e) =>
              setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="6-digit code"
          />
          {setupErr ? (
            <p className="text-[11px] font-semibold text-red-500">{setupErr}</p>
          ) : null}
          <button
            type="button"
            onClick={verifySms}
            className="flex h-10 w-full items-center justify-center rounded-md border-0 bg-[#FF6B35] text-[12px] font-bold text-white"
          >
            Enable SMS 2FA
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => {
          setSetupStep("pick");
          setSetupErr(null);
        }}
        className={cn(
          "w-full border-0 bg-transparent py-1.5 text-[12px] font-semibold",
          muted,
        )}
      >
        Back to methods
      </button>
    </div>
  );
}

export function AuthenticatorPanel({
  isLight,
  ink,
  muted,
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
    <div className="mt-3 space-y-3">
      <p className={cn("text-[12px] font-semibold", ink)}>
        Authenticator setup
      </p>
      <p className={cn("text-[11px] font-medium leading-relaxed", muted)}>
        Open Google Authenticator, Authy, or similar and scan the QR or enter
        the secret manually if you prefer.
      </p>
      {secret ? (
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={authenticatorQrUrl(secret, email)}
            alt="Authenticator QR code. Scan with your app"
            width={168}
            height={168}
            className="rounded-lg bg-white p-2"
            loading="lazy"
          />
          <p className={cn("text-[10px] font-medium", muted)}>
            Scan with your authenticator app
          </p>
        </div>
      ) : null}
      <div
        className={cn(
          "rounded-md px-3 py-2 font-mono text-[12px] font-bold tracking-wider break-all",
          isLight
            ? "bg-black/[0.08] text-slate-900"
            : "bg-white/[0.1] text-white",
        )}
      >
        {secret || "Not set"}
      </div>
      <p className={cn("text-[10px] font-medium", muted)}>
        Secret · Account Ona · Time-based (30s)
      </p>
      <input
        className={settingsInputClass(isLight)}
        inputMode="numeric"
        maxLength={6}
        value={authCode}
        onChange={(e) =>
          setAuthCode(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        placeholder="6-digit code from app"
      />
      {setupErr ? (
        <p className="text-[11px] font-semibold text-red-500">{setupErr}</p>
      ) : null}
      <button
        type="button"
        onClick={verifyAuth}
        className="flex h-10 w-full items-center justify-center rounded-md border-0 bg-[#FF6B35] text-[12px] font-bold text-white"
      >
        Enable authenticator 2FA
      </button>
      <button
        type="button"
        onClick={() => {
          setSetupStep("pick");
          setSetupErr(null);
        }}
        className={cn(
          "w-full border-0 bg-transparent py-1.5 text-[12px] font-semibold",
          muted,
        )}
      >
        Back to methods
      </button>
    </div>
  );
}
