import { Button } from "@/components/ui/button";
import type { Step } from "./types";

/** Footer actions per step. Step 4 keeps Create my account / Skip vehicle. Finish. */
export function SignupFooter({
  step,
  busy,
  hasVehicles,
  onNext,
  onFinish,
  onLogin,
}: {
  step: Step;
  busy: boolean;
  hasVehicles: boolean;
  onNext: () => void;
  onFinish: (opts?: { skipVehicle?: boolean }) => void;
  onLogin: () => void;
}) {
  if (step < 4) {
    return (
      <div className="flex flex-col gap-3">
        <Button size="ona" variant="ona" onClick={onNext} data-cta="next">
          Continue
        </Button>
        {step === 1 ? (
          <p className="text-center text-[12px] text-ona-muted">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex min-h-11 items-center border-0 bg-transparent p-0 font-semibold text-ona-brand-ink underline underline-offset-2"
            >
              Log in
            </button>
          </p>
        ) : null}
      </div>
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
