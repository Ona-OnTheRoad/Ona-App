import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";
import { PasswordInput } from "@/components/ui/password-input";
import { changeFlowFieldClass } from "./field-class";

/** Password + email code + optional guarantor identity check. */
export function VerifyIdentityStep({
  isLight,
  changeWhat,
  hasGuarantor,
  busy,
  password,
  onPassword,
  emailCode,
  onEmailCode,
  emailCodeSent,
  onSendEmailOtp,
  gName,
  onGName,
  onVerify,
}: {
  isLight: boolean;
  /** e.g. "phone number" / "email address" */
  changeWhat: string;
  hasGuarantor: boolean;
  busy: boolean;
  password: string;
  onPassword: (v: string) => void;
  emailCode: string;
  onEmailCode: (v: string) => void;
  emailCodeSent: boolean;
  onSendEmailOtp: () => void;
  gName: string;
  onGName: (v: string) => void;
  onVerify: () => void;
}) {
  const t = profileTheme(isLight);
  const fieldClass = changeFlowFieldClass(isLight);
  return (
    <div className="space-y-3">
      <p className={cn("text-[13px] font-bold", t.ink)}>Verify your identity</p>
      <p className={cn("text-[12px]", t.muted)}>
        {hasGuarantor
          ? "All three are required"
          : "Two-factor authentication required"}{" "}
        to change your {changeWhat}.
      </p>

      <div>
        <p className={cn("mb-1 text-[11px] font-semibold", t.muted)}>
          1. Current password
        </p>
        <PasswordInput
          className={fieldClass}
          placeholder="Enter your password"
          value={password}
          onChange={onPassword}
          isLight={isLight}
        />
      </div>

      <div>
        <p className={cn("mb-1 text-[11px] font-semibold", t.muted)}>
          2. Email verification code
        </p>
        {!emailCodeSent ? (
          <button
            type="button"
            disabled={busy}
            onClick={onSendEmailOtp}
            className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send code to email"}
          </button>
        ) : (
          <input
            className={fieldClass}
            placeholder="000000"
            value={emailCode}
            onChange={(e) =>
              onEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            maxLength={6}
          />
        )}
      </div>

      {hasGuarantor && (
        <div>
          <p className={cn("mb-1 text-[11px] font-semibold", t.muted)}>
            3. Guarantor name
          </p>
          <input
            className={fieldClass}
            placeholder="Enter your guarantor's full name"
            value={gName}
            onChange={(e) => onGName(e.target.value)}
          />
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={onVerify}
        className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
      >
        {busy ? "Verifying…" : "Verify identity"}
      </button>
    </div>
  );
}
