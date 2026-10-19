import { Button } from "@/components/ui/button";
import type { Step } from "./types";

/** Footer actions per step. Step 3 keeps Create my account / Skip vehicle. Finish. */
export function SignupFooter({
  step,
  busy,
  hasVehicles,
  onNext,
  onFinish,
}: {
  step: Step;
  busy: boolean;
  hasVehicles: boolean;
  onNext: () => void;
  onFinish: (opts?: { skipVehicle?: boolean }) => void;
}) {
  if (step < 3) {
    return (
      <Button size="ona" variant="ona" onClick={onNext} data-cta="next">
        Continue
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="ona"
        variant="ona"
        disabled={busy || !hasVehicles}
        busy={busy}
        busyLabel="Please wait…"
        onClick={() => onFinish()}
      >
        Create my account
      </Button>
      <Button
        size="ona"
        variant="onaOutline"
        disabled={busy}
        onClick={() => onFinish({ skipVehicle: true })}
      >
        Skip vehicle. Finish
      </Button>
    </div>
  );
}
