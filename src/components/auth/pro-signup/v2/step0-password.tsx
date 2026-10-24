"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { OnaRuleList } from "@/components/ui/ona-rule-list";
import {
  confirmPasswordError,
  isValidPassword,
  passwordChecklist,
  passwordError,
} from "@/lib/signup-validation";

interface Step0PasswordProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  onContinue: () => void;
  isDual?: boolean;
}

export function Step0Password({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onContinue,
  isDual,
}: Step0PasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const pwdError = touched ? passwordError(password) : null;
  const matchError = confirmTouched
    ? confirmPasswordError(password, confirmPassword)
    : null;

  const isValid =
    isValidPassword(password) &&
    password.length > 0 &&
    confirmPassword === password;

  if (isDual) {
    const isDualValid = password.trim().length >= 6;
    return (
      <div className="flex flex-col flex-1 px-5 pt-4 pb-10 bg-ona-bg text-ona-ink">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-ona-ink tracking-tight">
            Confirm your password
          </h1>
          <p className="mt-1.5 text-xs text-ona-muted leading-relaxed">
            Enter your existing Customer account password to add the Repair Pro role.
          </p>
        </div>

        {/* Form Field */}
        <div className="flex flex-col gap-5 flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ona-ink">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  setConfirmPassword(val);
                  setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                placeholder="Enter your current password"
                autoComplete="current-password"
                className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 pr-10 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ona-muted hover:text-ona-ink cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {touched && password.trim().length > 0 && password.trim().length < 6 && (
              <p className="text-[12px] font-medium text-ona-danger">
                Password must be at least 6 characters.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="pt-6">
          <button
            type="button"
            onClick={onContinue}
            disabled={!isDualValid}
            className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
              isDualValid
                ? "bg-brand hover:opacity-90 text-white active:scale-[0.99]"
                : "bg-brand/50 text-white cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-10 bg-ona-bg text-ona-ink">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ona-ink tracking-tight">
          Set your password
        </h1>
        <p className="mt-1.5 text-xs text-ona-muted leading-relaxed">
          Choose a strong password with at least 10 characters, a number, and a
          symbol.
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-5 flex-1">
        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Create a password"
              autoComplete="new-password"
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 pr-10 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ona-muted hover:text-ona-ink cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {pwdError && (
            <p className="text-[12px] font-medium text-ona-danger">{pwdError}</p>
          )}
        </div>

        {/* Requirements */}
        <div className="rounded-xl border border-ona-border bg-ona-surface p-3.5">
          <OnaRuleList
            title="Password requirements"
            rules={passwordChecklist(password)}
          />
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmTouched(true);
              }}
              onBlur={() => setConfirmTouched(true)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 pr-10 text-sm text-ona-ink placeholder:text-ona-muted outline-none focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ona-muted hover:text-ona-ink cursor-pointer"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {matchError && (
            <p className="text-[12px] font-medium text-ona-danger">
              {matchError}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
            isValid
              ? "bg-brand hover:opacity-90 text-white active:scale-[0.99]"
              : "bg-brand/50 text-white cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
