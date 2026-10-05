"use client";

import { cn } from "@/lib/utils";
import {
  AuthenticatorPanel,
  PickMethodPanel,
  SmsPanel,
} from "./two-fa-setup-panels";
import type { useTwoFa } from "./use-two-fa";

type Props = {
  isLight: boolean;
  isPro: boolean;
  card: string;
  ink: string;
  muted: string;
  email: string;
  phone?: string;
  fa: ReturnType<typeof useTwoFa>;
};

export function TwoFaSection({
  isLight,
  isPro,
  card,
  ink,
  muted,
  email,
  phone,
  fa,
}: Props) {
  const {
    twoFaOn,
    setTwoFaOn,
    method,
    setupStep,
    setSetupStep,
    secret,
    smsCode,
    setSmsCode,
    authCode,
    setAuthCode,
    setupErr,
    setSetupErr,
    smsSent,
    setSmsSent,
    setConfirmCancel,
    persistEnabled,
    onToggle,
    verifySms,
    verifyAuth,
  } = fa;
  return (
    <div className={cn("rounded-md px-3 py-3", card)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[13px] font-bold", ink)}>
            Two-factor authentication
          </p>
          <p className={cn("mt-0.5 text-[11px] font-medium", muted)}>
            {twoFaOn && method
              ? method === "sms"
                ? "On · SMS"
                : "On · Authenticator app"
              : setupStep !== "idle"
                ? "Complete setup to enable"
                : isPro
                  ? "Off · recommended for pros"
                  : "Off · recommended"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={twoFaOn || setupStep !== "idle"}
          onClick={onToggle}
          className={cn(
            "h-7 w-12 shrink-0 rounded-full border-0 transition-colors",
            twoFaOn || setupStep !== "idle"
              ? "bg-[#FF6B35]"
              : isLight
                ? "bg-black/20"
                : "bg-white/20",
          )}
        >
          <span
            className={cn(
              "block h-5 w-5 rounded-full bg-white transition-transform",
              twoFaOn || setupStep !== "idle"
                ? "translate-x-6"
                : "translate-x-1",
            )}
          />
        </button>
      </div>

      {/* Immediate setup when toggle is engaged */}
      {setupStep === "pick" ? (
        <PickMethodPanel
          isLight={isLight}
          ink={ink}
          muted={muted}
          phone={phone}
          setSetupErr={setSetupErr}
          setSetupStep={setSetupStep}
          setSmsSent={setSmsSent}
          onCancel={() => setConfirmCancel(true)}
        />
      ) : null}

      {setupStep === "sms" ? (
        <SmsPanel
          isLight={isLight}
          ink={ink}
          muted={muted}
          phone={phone}
          setupErr={setupErr}
          setSetupErr={setSetupErr}
          setSetupStep={setSetupStep}
          smsSent={smsSent}
          setSmsSent={setSmsSent}
          smsCode={smsCode}
          setSmsCode={setSmsCode}
          verifySms={verifySms}
        />
      ) : null}

      {setupStep === "authenticator" ? (
        <AuthenticatorPanel
          isLight={isLight}
          ink={ink}
          muted={muted}
          setupErr={setupErr}
          setSetupErr={setSetupErr}
          setSetupStep={setSetupStep}
          secret={secret}
          email={email}
          authCode={authCode}
          setAuthCode={setAuthCode}
          verifyAuth={verifyAuth}
        />
      ) : null}

      {twoFaOn && method && setupStep === "idle" ? (
        <button
          type="button"
          onClick={() => {
            setSetupStep("pick");
            setTwoFaOn(false);
            persistEnabled(false, null);
          }}
          className={cn(
            "mt-2 w-full border-0 bg-transparent py-1 text-left text-[11px] font-semibold",
            muted,
          )}
        >
          Change 2FA method
        </button>
      ) : null}
    </div>
  );
}
