import { useId } from "react";
import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";
import { changeFlowFieldClass } from "./field-class";

/** Enter-the-6-digit-code step shared by phone, email and bank flows. */
export function OtpCodeStep({
  isLight,
  prompt,
  value,
  onChange,
  busy,
  onVerify,
}: {
  isLight: boolean;
  prompt: string;
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  onVerify: () => void;
}) {
  const t = profileTheme(isLight);
  const fieldClass = changeFlowFieldClass(isLight);
  const promptId = useId();
  return (
    <div className="space-y-2">
      <p id={promptId} className={cn("text-[12px]", t.muted)}>
        {prompt}
      </p>
      <input
        className={fieldClass}
        placeholder="000000"
        aria-label="6-digit security code"
        aria-describedby={promptId}
        // Lets iOS/Android suggest the SMS code and Chrome's WebOTP fill it.
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        maxLength={6}
      />
      <button
        type="button"
        disabled={busy || value.length < 4}
        onClick={onVerify}
        className="h-10 w-full rounded-xl border-0 bg-brand text-[13px] font-bold text-white disabled:opacity-50"
      >
        {busy ? "Verifying…" : "Verify code"}
      </button>
    </div>
  );
}
