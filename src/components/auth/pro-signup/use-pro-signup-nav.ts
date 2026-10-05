import { needsVehiclesSignupStep } from "@/lib/artisan/catalog";
import { FLOW_STEPS, type Step } from "./constants";
import type { ProSignupFlow } from "./use-pro-signup-flow";
import type { ProSignupForm } from "./use-pro-signup-form";
import type { SkillSelection } from "./use-skill-selection";
import type { VehicleFocus } from "./use-vehicle-focus";
import type { VehiclesCanFix } from "./use-vehicles-can-fix";
import { validateStep4, validateStep5 } from "./validation";

type NavArgs = {
  flow: ProSignupFlow;
  form: ProSignupForm;
  skillSel: SkillSelection;
  focus: VehicleFocus;
  fix: VehiclesCanFix;
  step4Ok: boolean;
  step5Ok: boolean;
  step6Ok: boolean;
  fromMenu: boolean;
  fromProfile: boolean;
  routerReplace: (href: string) => void;
  routerPush: (href: string) => void;
  go: (href: string) => void;
  finish: () => Promise<void>;
};

/** Back / Continue handling for the signup wizard. */
export function useProSignupNav({
  flow,
  form,
  skillSel,
  focus,
  fix,
  step4Ok,
  step5Ok,
  step6Ok,
  fromMenu,
  fromProfile,
  routerReplace,
  routerPush,
  go,
  finish,
}: NavArgs) {
  const { step, setStep, setFormError } = flow;
  const { skill, specialty } = skillSel;

  const goBack = () => {
    if (fix.vehiclePicker) {
      fix.closeVehiclePicker();
      return;
    }
    if (focus.pickerKey) {
      focus.closePicker();
      return;
    }
    if (step === 1) {
      if (fromMenu) {
        // Dual-signup from ☰ return to Customer home
        routerReplace("/");
        return;
      }
      if (fromProfile) {
        routerPush("/profile");
        return;
      }
      go("/login/role");
      return;
    }
    const idx = FLOW_STEPS.indexOf(step);
    if (idx <= 0) return;
    let prev = FLOW_STEPS[idx - 1];
    // Skip vehicle step when going back if trade doesn't need it
    if (prev === 3 && !needsVehiclesSignupStep(skill, specialty)) {
      prev = 2;
    }
    setStep(prev);
  };

  const nextFlowStep = (s: Step): Step | null => {
    const idx = FLOW_STEPS.indexOf(s);
    if (idx < 0 || idx >= FLOW_STEPS.length - 1) return null;
    let next = FLOW_STEPS[idx + 1];
    // Solar / generator / home trades: never show mechanic-style vehicle list
    if (next === 3 && !needsVehiclesSignupStep(skill, specialty)) {
      next = FLOW_STEPS[idx + 2] ?? null;
    }
    return next ?? null;
  };

  const onNext = () => {
    if (step === 7) {
      void finish();
      return;
    }
    if (step === 1) {
      if (!skill) {
        setFormError("Please select your trade.");
        return;
      }
      setFormError("");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!specialty?.trim()) {
        setFormError("Please pick your focus area.");
        return;
      }
      setFormError("");
      // Mechanic etc. → vehicles; solar/generator/home → about you
      setStep(needsVehiclesSignupStep(skill, specialty) ? 3 : 4);
      return;
    }
    if (step === 3) {
      setFormError("");
      setStep(4);
      return;
    }
    if (step === 4) {
      const err = validateStep4(form);
      if (err) {
        setFormError(err);
        return;
      }
    }
    if (step === 5) {
      const err = validateStep5(form);
      if (err) {
        setFormError(err);
        return;
      }
    }
    const blocked =
      (step === 4 && !step4Ok) ||
      (step === 5 && !step5Ok) ||
      (step === 6 && !step6Ok);
    if (blocked) return;
    const nxt = nextFlowStep(step);
    if (!nxt) return;
    setFormError("");
    setStep(nxt);
  };

  return { goBack, onNext };
}
