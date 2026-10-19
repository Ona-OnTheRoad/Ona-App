import { useState } from "react";
import { useRouter } from "next/navigation";
import { expressAssignedTitle, isExpressTrade } from "@/lib/express/pricing";
import { useApp } from "@/lib/store";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import type { Stage } from "./types";
import { useExpressEntry } from "./use-express-entry";
import { useExpressPayment } from "./use-express-payment";
import { useExpressQuestions } from "./use-express-questions";
import { useExpressQuote } from "./use-express-quote";
import { useExpressSchedule } from "./use-express-schedule";
import { useExpressVehicles } from "./use-express-vehicles";

/** Orchestrates the Express booking flow: stage machine + step hooks. */
export function useExpressFlow() {
  const router = useRouter();
  const { isAuthenticated } = useApp();

  const [stage, setStage] = useState<Stage>("categories");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useFeedbackToast("", error ?? "");

  const questions = useExpressQuestions({ setStage, setError });
  const vehicles = useExpressVehicles({
    isAuthenticated,
    setError,
    startQuestions: questions.startQuestions,
  });
  const quoteState = useExpressQuote({
    answers: questions.answers,
    setStage,
    setError,
    setBusy,
  });
  const schedule = useExpressSchedule();
  const payment = useExpressPayment({
    stage,
    setStage,
    setError,
    busy,
    setBusy,
    quote: quoteState.quote,
    pickedLoc: quoteState.pickedLoc,
    urgency: quoteState.urgency,
    answers: questions.answers,
    vehicleLabel: vehicles.vehicleLabel,
    bookingType: schedule.bookingType,
    scheduleIso: schedule.scheduleIso,
    detectedTrade: questions.detectedTrade,
  });
  useExpressEntry({
    stage,
    setStage,
    setError,
    setRequestId: payment.setRequestId,
    setPickedLoc: quoteState.setPickedLoc,
    setQuote: quoteState.setQuote,
    setAssignedPro: payment.setAssignedPro,
  });

  const quote = quoteState.quote;
  const detected = isExpressTrade(quote?.trade ?? "") ? quote!.trade : null;

  /** Header + bottom Back: step backwards through the flow, never jump pages. */
  const goBack = () => {
    setError(null);
    switch (stage) {
      case "categories":
        router.back();
        break;
      case "vehicle":
        setStage("categories");
        break;
      case "questions": {
        if (!questions.popQuestion()) setStage("vehicle");
        break;
      }
      case "booking":
        setStage("detected");
        break;
      case "detected":
        setStage("questions");
        break;
      case "location":
        setStage("booking");
        break;
      case "urgency":
        setStage("location");
        break;
      case "pay":
        setStage("urgency");
        break;
      default:
        /* paying / assigned: back is locked while confirming or done */
        break;
    }
  };

  const title =
    stage === "categories"
      ? "Ona Express"
      : stage === "booking"
        ? "How do you want it done?"
        : stage === "location"
          ? "Where should the professional come to?"
          : stage === "pay"
            ? "Confirm & pay upfront"
            : stage === "paying"
              ? "Confirming your payment…"
              : stage === "assigned" && detected
                ? expressAssignedTitle(detected)
                : "OgaMecho";

  return {
    stage,
    setStage,
    error,
    setError,
    busy,
    goBack,
    title,
    detected,
    questions,
    vehicles,
    quoteState,
    schedule,
    payment,
  };
}
