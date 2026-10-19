import { AccountPasswordFields } from "./account-password-fields";
import type { MotoristFields } from "./use-motorist-fields";

/** Screen 2: "Set your password". */
export function StepPassword({
  f,
  dualPasswordOk,
}: {
  f: MotoristFields;
  dualPasswordOk: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <AccountPasswordFields f={f} dualPasswordOk={dualPasswordOk} />
    </div>
  );
}
