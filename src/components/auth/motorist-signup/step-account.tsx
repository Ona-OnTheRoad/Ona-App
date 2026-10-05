import { IDENTITY_RULE_COPY } from "@/lib/account-registry";
import { AccountIdFields } from "./account-id-fields";
import { AccountIdentityFields } from "./account-identity-fields";
import { AccountPasswordFields } from "./account-password-fields";
import type { MotoristFields } from "./use-motorist-fields";

/** Step 1: account details. */
export function StepAccount({
  f,
  formError,
  dualPasswordOk,
}: {
  f: MotoristFields;
  formError: string;
  dualPasswordOk: boolean;
}) {
  const { dualSignup } = f;
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
      <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-hide">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
          Your details
        </p>

        {dualSignup && (
          <p className="rounded-md bg-[#e8e9ed] px-2.5 py-2 text-[11px] leading-snug text-[#334155]">
            Continue from your Repair Pro account
          </p>
        )}

        <AccountIdentityFields f={f} />

        <AccountIdFields f={f} />

        <AccountPasswordFields f={f} dualPasswordOk={dualPasswordOk} />

        {formError && (
          <p
            className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] font-medium leading-snug text-red-700"
            role="alert"
          >
            {formError}
          </p>
        )}
      </div>

      <p className="shrink-0 text-center text-[10px] leading-snug text-[#64748b]">
        {dualSignup
          ? "Empty NIN/BVN stay editable · opens as Customer"
          : IDENTITY_RULE_COPY}
      </p>
    </div>
  );
}
