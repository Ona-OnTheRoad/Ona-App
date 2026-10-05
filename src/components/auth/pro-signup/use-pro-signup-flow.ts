import { useState } from "react";
import type { Step } from "./constants";

/** Wizard progress state: current step, completion, busy flag, form-level error. */
export function useProSignupFlow() {
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  return { step, setStep, done, setDone, busy, setBusy, formError, setFormError };
}

export type ProSignupFlow = ReturnType<typeof useProSignupFlow>;
