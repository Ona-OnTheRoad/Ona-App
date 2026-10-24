import { AccountIdentityFields } from "./account-identity-fields";
import { AccountReferralField } from "./account-referral-field";
import type { MotoristFields } from "./use-motorist-fields";

/** Screen 1: "Create account" details. */
export function StepDetails({
  f,
  urlRef,
  refInput,
  setRefInput,
}: {
  f: MotoristFields;
  urlRef: string;
  refInput: string;
  setRefInput: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {f.dualSignup ? (
        <p className="rounded-ona-ctl bg-ona-brand-soft px-3 py-2.5 text-[12px] font-medium leading-snug text-ona-ink">
          Continue from your Repair Pro account
        </p>
      ) : null}
      <AccountIdentityFields f={f} />
      {!f.dualSignup ? (
        <AccountReferralField
          value={refInput}
          onChange={setRefInput}
          fromUrl={Boolean(urlRef)}
        />
      ) : null}
    </div>
  );
}
