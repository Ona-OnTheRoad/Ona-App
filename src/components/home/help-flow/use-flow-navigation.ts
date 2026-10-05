"use client";

import type { Dispatch, SetStateAction } from "react";
import { clearSession } from "@/lib/session-restore";
import type { ProService } from "@/lib/types";
import type {
  BaseRoute,
  ExtraSnapshot,
  HelpFlowConfig,
} from "../help-flow-configs";
import type { FlowDir } from "./types";

interface FlowNavigationArgs {
  config: HelpFlowConfig;
  onExit?: () => void;
  stack: string[];
  setStack: Dispatch<SetStateAction<string[]>>;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  step: string;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  setDir: Dispatch<SetStateAction<FlowDir>>;
  setError: Dispatch<SetStateAction<string | null>>;
  route: BaseRoute | null;
  setRoute: Dispatch<SetStateAction<BaseRoute | null>>;
  setChosenTrade: Dispatch<SetStateAction<ProService>>;
  finalStep: string;
  setFinalStep: Dispatch<SetStateAction<string>>;
  setExtraState: Dispatch<SetStateAction<ExtraSnapshot>>;
  clearAdvanceTimer: () => void;
}

/** Step navigation: push / pick / back, route confirmation and final-step paging. */
export function useFlowNavigation({
  config,
  onExit,
  stack,
  setStack,
  answers,
  setAnswers,
  step,
  draft,
  setDraft,
  setDir,
  setError,
  route,
  setRoute,
  setChosenTrade,
  finalStep,
  setFinalStep,
  setExtraState,
  clearAdvanceTimer,
}: FlowNavigationArgs) {
  /* ---- navigation ------------------------------------------------------- */
  const handleExit = () => {
    clearSession(config.sessionKey);
    onExit?.();
  };

  const push = (next: string, nextAnswers: Record<string, string>) => {
    if (config.onPush) {
      const handled = config.onPush(next, nextAnswers, {
        setStack,
        setAnswers,
        setExtraState,
        setChosenTrade,
        setFinalStep,
        route,
      });
      if (handled) return;
    }
    setDir("fwd");
    setError(null);
    if (config.resolveRoute && (next === "confirm" || next === "final")) {
      const resolved = config.resolveRoute(nextAnswers);
      setRoute(resolved);
      setChosenTrade(resolved.trade);
    }
    setStack((prev) => [...prev, next]);
  };

  const pick = (optionId: string, label: string) => {
    const nextAnswers = {
      ...answers,
      [step]: optionId,
      [`${step}_label`]: label,
    };
    setAnswers(nextAnswers);
    const next = config.nextScreen(step, optionId, nextAnswers);
    if (next) push(next, nextAnswers);
  };

  const submitText = () => {
    if (!config.canAdvanceText(draft)) {
      setError("A few words is enough.");
      return;
    }
    const nextAnswers = {
      ...answers,
      [step]: draft.trim(),
      [`${step}_label`]: draft.trim(),
    };
    setAnswers(nextAnswers);
    setDraft("");
    const next = config.nextScreen(step, draft.trim(), nextAnswers);
    if (next) push(next, nextAnswers);
  };

  const goBack = () => {
    if (stack.length <= 1) return;
    setError(null);
    setDir("back");
    const prev = stack[stack.length - 2];
    const leaving = stack[stack.length - 1];
    setStack((s) => s.slice(0, -1));
    if (config.screen(leaving)?.kind === "text") {
      setDraft((answers[leaving] as string) || "");
    } else {
      setDraft(
        answers[prev] && config.screen(prev)?.kind === "text"
          ? (answers[prev] as string)
          : "",
      );
    }
  };

  /* ---- confirm route ---------------------------------------------------- */
  const acceptRoute = (yes: boolean) => {
    if (config.onAcceptRoute) {
      const handled = config.onAcceptRoute(yes, {
        route,
        setChosenTrade,
        setFinalStep,
        setStack,
        setAnswers,
        setExtraState,
        setError,
      });
      if (handled) return;
    }
    if (!route || !config.applyConfirmChoice || !route.trade) return;
    setChosenTrade(
      config.applyConfirmChoice(
        route as BaseRoute & { trade: ProService },
        yes,
      ),
    );
    setDir("fwd");
    setFinalStep(config.finalSteps[0] ?? "urgency");
    setStack((s) => [...s, "final"]);
  };

  /* ---- final step navigation -------------------------------------------- */
  const nextFinal = () => {
    clearAdvanceTimer();
    setError(null);
    setFinalStep((prev) => {
      const idx = config.finalSteps.indexOf(prev);
      return idx >= 0 && idx < config.finalSteps.length - 1
        ? config.finalSteps[idx + 1]
        : prev;
    });
  };

  const finalBack = () => {
    clearAdvanceTimer();
    setError(null);
    if (finalStep === config.finalSteps[0]) {
      goBack();
      return;
    }
    setFinalStep((prev) => {
      const idx = config.finalSteps.indexOf(prev);
      return idx > 0 ? config.finalSteps[idx - 1] : prev;
    });
  };

  return {
    handleExit,
    push,
    pick,
    submitText,
    goBack,
    acceptRoute,
    nextFinal,
    finalBack,
  };
}
