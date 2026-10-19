import { useState } from "react";
import { OnaField, OnaInput } from "@/components/ui/ona-field";

/**
 * Referral code. Prefilled and read-only when it came from `?ref=`; otherwise an
 * optional input. "Apply code" only confirms the value in the UI (it is sent as
 * `refCode` with the profile either way, exactly like the URL param before).
 */
export function AccountReferralField({
  value,
  onChange,
  fromUrl,
}: {
  value: string;
  onChange: (v: string) => void;
  fromUrl: boolean;
}) {
  const [applied, setApplied] = useState(fromUrl && Boolean(value.trim()));
  const locked = fromUrl || applied;
  return (
    <OnaField
      label="Referral Code"
      hint={applied && value.trim() ? "Code applied." : undefined}
    >
      {({ id, describedBy }) => (
        <div className="relative">
          <OnaInput
            id={id}
            aria-describedby={describedBy}
            className="pr-[104px]"
            value={value}
            readOnly={locked}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter code"
            autoComplete="off"
            autoCapitalize="characters"
          />
          {fromUrl ? null : (
            <button
              type="button"
              onClick={() => {
                if (!applied && !value.trim()) return;
                setApplied((a) => !a);
              }}
              className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-[8px] border-0 bg-ona-brand-btn px-3 text-[12px] font-semibold text-white"
            >
              {applied ? "Change" : "Apply code"}
            </button>
          )}
        </div>
      )}
    </OnaField>
  );
}
