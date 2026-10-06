import { useState } from "react";
import {
  detectExpressTrade,
  getExpressScreen,
  nextExpressStep,
} from "@/lib/express/question-engine";
import type { Stage } from "./types";

type Args = {
  setStage: (s: Stage) => void;
  setError: (e: string | null) => void;
};

/** Smart cascading question state: screen stack, answers, trade detection. */
export function useExpressQuestions({ setStage, setError }: Args) {
  const [screenId, setScreenId] = useState("main");
  const [screenStack, setScreenStack] = useState<string[]>(["main"]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [detectedTrade, setDetectedTrade] = useState<string | null>(null);

  const screen = getExpressScreen(screenId);

  /** Reset the Q&A and enter the questions stage. */
  const startQuestions = () => {
    setStage("questions");
    setAnswers({});
    setScreenId("main");
    setScreenStack(["main"]);
  };

  const pickOption = (optionId: string, label: string) => {
    const nextAnswers = {
      ...answers,
      [screenId]: optionId,
      [`${screenId}_label`]: label,
    };
    setAnswers(nextAnswers);
    setError(null);
    const next = nextExpressStep(screenId, optionId, nextAnswers);
    if (next === "detect") {
      setDetectedTrade(detectExpressTrade(nextAnswers));
      setStage("detected");
    } else {
      setScreenId(next);
      setScreenStack((prev) => [...prev, next]);
    }
  };

  const submitText = () => {
    if (!draft.trim()) return;
    const nextAnswers = {
      ...answers,
      [screenId]: draft.trim(),
      [`${screenId}_label`]: draft.trim(),
    };
    setAnswers(nextAnswers);
    setDraft("");
    setDetectedTrade(detectExpressTrade(nextAnswers));
    setStage("detected");
  };

  /** Step back one question; returns false when already on the first one. */
  const popQuestion = (): boolean => {
    if (screenStack.length <= 1) return false;
    const leaving = screenId;
    const prevId = screenStack[screenStack.length - 2];
    const nextAnswers = { ...answers };
    delete nextAnswers[leaving];
    delete nextAnswers[`${leaving}_label`];
    setAnswers(nextAnswers);
    setScreenStack((prev) => prev.slice(0, -1));
    setScreenId(prevId);
    return true;
  };

  return {
    screen,
    answers,
    draft,
    setDraft,
    detectedTrade,
    startQuestions,
    pickOption,
    submitText,
    popQuestion,
  };
}
