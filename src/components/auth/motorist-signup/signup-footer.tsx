import { Button } from "@/components/ui/button";
import type { Step } from "./types";

/** Footer actions per step. Step 3 keeps Create my account / Skip vehicle. */
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
        className="disabled:bg-ona-brand/40 disabled:text-white"
        disabled={busy || !hasVehicles}
        busy={busy}
        busyLabel="Please wait…"
        onClick={() => onFinish()}
      >
        Continue
      </Button>
      <Button
        size="ona"
        variant="onaOutline"
        disabled={busy}
        onClick={() => onFinish({ skipVehicle: true })}
      >
        Skip vehicle
      </Button>
    </div>
  );
}
