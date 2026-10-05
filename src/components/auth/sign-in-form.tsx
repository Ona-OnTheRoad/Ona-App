"use client";

import { ChevronLeft } from "lucide-react";
import {
  AuthPlate,
  authBackBtnClass,
  authFieldClass,
  authLabelClass,
} from "@/components/auth/auth-plate";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FAIL_THRESHOLD } from "./sign-in-form/helpers";
import { useSignInForm } from "./sign-in-form/use-sign-in-form";

/** Near-black for secondary links (auth plate is always light gray) */
const AUTH_LINK_NEAR_BLACK = "#0a0a0a";

/**
 * Phone-only login (email is signup-only).
 * Unfolds on one page: Role → phone + code.
 */
export function SignInForm() {
  const t = useT();
  const { exiting, go } = useAuthNavigate();
  const {
    preferType,
    phone,
    otp,
    setOtp,
    otpSent,
    info,
    busy,
    failedAttempts,
    inCooldown,
    cooldownLeft,
    showPhone,
    displayError,
    pickRole,
    onPhoneChange,
    onSendCode,
    onSubmit,
  } = useSignInForm();

  const pill = (active: boolean) =>
    cn(
      "h-10 rounded-md border-0 text-[12px] font-bold transition-colors",
      active
        ? "bg-[#323231] text-white"
        : "bg-black/[0.06] text-[#1e293b] hover:bg-black/[0.1]",
    );

  return (
    <AuthPlate exiting={exiting}>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-5 pt-5">
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem("ona-entry-done");
            } catch {
              /* ignore */
            }
            go("/login");
          }}
          className={authBackBtnClass}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          {t("common.back")}
        </button>

        <h1 className="text-[22px] font-bold tracking-tight text-[#1e293b]">
          {t("auth.logIn")}
        </h1>
        <p className="mt-1 text-[12px] font-medium text-[#475569]">
          Use the exact phone number you registered at signup
        </p>

        <form onSubmit={onSubmit} className="mt-4 flex flex-1 flex-col gap-4">
          <div>
            <span className={authLabelClass}>{t("auth.loginAs")}</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => pickRole("motorist")}
                className={pill(preferType === "motorist")}
              >
                {t("auth.motorist")}
              </button>
              <button
                type="button"
                onClick={() => pickRole("professional")}
                className={pill(preferType === "professional")}
              >
                {t("auth.pro")}
              </button>
            </div>
          </div>

          {showPhone ? (
            <div className="om-sheet-spring flex flex-1 flex-col gap-3.5">
              <label className="block">
                <span className={authLabelClass}>{t("auth.phone")}</span>
                <input
                  className={authFieldClass}
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="+234 801 234 5678"
                  required
                />
              </label>

              {otpSent ? (
                <label className="block">
                  <span className={authLabelClass}>SMS code</span>
                  <input
                    className={authFieldClass}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    required
                  />
                </label>
              ) : null}

              {otpSent ? (
                <button
                  type="button"
                  disabled={
                    busy || (failedAttempts >= FAIL_THRESHOLD && inCooldown)
                  }
                  onClick={() => void onSendCode()}
                  className="text-left text-[12px] font-semibold text-[#FF6B35] disabled:opacity-50"
                >
                  {failedAttempts >= FAIL_THRESHOLD && inCooldown
                    ? `Please wait ${cooldownLeft}s before requesting another code.`
                    : t("auth.resendCode")}
                </button>
              ) : null}

              {info ? (
                <p
                  className="text-[12px] font-medium text-emerald-700"
                  role="status"
                >
                  {info}
                </p>
              ) : null}
              {displayError ? (
                <p
                  className="text-[12px] font-medium text-red-600 tabular-nums"
                  role="alert"
                >
                  {displayError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="om-cta-dark-gray mt-auto"
                style={{
                  WebkitAppearance: "none",
                  appearance: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 44,
                  border: "none",
                  borderRadius: 6,
                  background: "#323231",
                  backgroundColor: "#323231",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy
                  ? t("auth.pleaseWait")
                  : otpSent
                    ? t("auth.verifyAndLogin")
                    : "Send code"}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className={cn(
              "border-0 bg-transparent p-0 text-[13px] font-semibold",
              showPhone ? "" : "mt-auto",
            )}
            style={{ color: AUTH_LINK_NEAR_BLACK }}
            onClick={() => go("/login/role")}
          >
            {t("auth.newHere")}
          </button>
        </form>
      </div>
    </AuthPlate>
  );
}
