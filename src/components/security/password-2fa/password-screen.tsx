"use client";

import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { ConfirmCancelSheet } from "@/components/ui/confirm-cancel-sheet";
import { useChangePassword } from "@/components/settings-pages/security/use-change-password";
import { useTwoFa } from "@/components/settings-pages/security/use-two-fa";
import {
  AuthenticatorPanel,
  PickMethodPanel,
  SmsPanel,
} from "@/components/settings-pages/security/two-fa-setup-panels";
import { SecurityScreenHeader } from "../security-screen-header";
import { PasswordInputField } from "./password-input-field";
import { PasswordRequirementsChecklist } from "./password-requirements-checklist";
import { TwoFactorAuthCard } from "./two-factor-auth-card";

export function PasswordScreen() {
  const router = useRouter();
  const { theme, userProfile, accountType } = useApp();
  const isLight = theme === "light";
  const email = userProfile?.email || "guest";

  const pw = useChangePassword();
  const fa = useTwoFa(email);

  const handleBack = () => {
    navigateBack(router, "/settings/sections/security", accountType);
  };

  const ink = "text-ona-ink";
  const muted = "text-ona-muted";

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SecurityScreenHeader
          title="Security"
          subtitle="Password & account protection"
          onBack={handleBack}
        />

        {/* Password Form */}
        <div className="space-y-4 pt-1">
          <PasswordInputField
            id="current-password"
            label="Password"
            value={pw.current}
            onChange={pw.setCurrent}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <PasswordInputField
            id="new-password"
            label="New Password"
            value={pw.next}
            onChange={pw.setNext}
            placeholder="Create a password"
            autoComplete="new-password"
          />

          <PasswordRequirementsChecklist password={pw.next} />

          <PasswordInputField
            id="confirm-password"
            label="Confirm password"
            value={pw.confirm}
            onChange={pw.setConfirm}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />

          <button
            type="button"
            onClick={pw.changePassword}
            disabled={pw.busy || !pw.next}
            className="w-full h-12 rounded-ona-ctl bg-brand text-white font-bold text-[14px] transition-opacity hover:opacity-95 active:opacity-85 disabled:opacity-50 cursor-pointer"
          >
            {pw.busy ? "Updating..." : "Update password"}
          </button>
        </div>

        {/* Two-Factor Authentication */}
        {fa.setupStep === "idle" ? (
          <TwoFactorAuthCard
            enabled={fa.twoFaOn}
            onToggle={fa.onToggle}
          />
        ) : (
          <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4 shadow-xs">
            <TwoFactorAuthCard
              enabled={fa.twoFaOn}
              onToggle={fa.onToggle}
            />
            {fa.setupStep === "pick" && (
              <div className="mt-3">
                <PickMethodPanel
                  isLight={isLight}
                  ink={ink}
                  muted={muted}
                  phone={userProfile?.phone}
                  setSetupErr={fa.setSetupErr}
                  setSetupStep={fa.setSetupStep}
                  setSmsSent={fa.setSmsSent}
                  onCancel={() => fa.setConfirmCancel(true)}
                />
              </div>
            )}
            {fa.setupStep === "sms" && (
              <div className="mt-3">
                <SmsPanel
                  isLight={isLight}
                  ink={ink}
                  muted={muted}
                  phone={userProfile?.phone}
                  setupErr={fa.setupErr}
                  setSetupErr={fa.setSetupErr}
                  setSetupStep={fa.setSetupStep}
                  smsSent={fa.smsSent}
                  setSmsSent={fa.setSmsSent}
                  smsCode={fa.smsCode}
                  setSmsCode={fa.setSmsCode}
                  verifySms={fa.verifySms}
                />
              </div>
            )}
            {fa.setupStep === "authenticator" && (
              <div className="mt-3">
                <AuthenticatorPanel
                  isLight={isLight}
                  ink={ink}
                  muted={muted}
                  setupErr={fa.setupErr}
                  setSetupErr={fa.setSetupErr}
                  setSetupStep={fa.setSetupStep}
                  secret={fa.secret}
                  email={email}
                  authCode={fa.authCode}
                  setAuthCode={fa.setAuthCode}
                  verifyAuth={fa.verifyAuth}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmCancelSheet
        open={fa.confirmCancel}
        isLight={isLight}
        title="Cancel setup?"
        message="Your security setup will not be saved."
        onClose={() => fa.setConfirmCancel(false)}
        onConfirm={() => {
          fa.setConfirmCancel(false);
          fa.cancelSetup();
        }}
      />
    </div>
  );
}
