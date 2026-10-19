"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCreateJob } from "@/lib/jobs/client";
import { decideHelpTrade } from "@/lib/callout/dispatch-trades";
import { useApp } from "@/lib/store";
import {
  nearestProDistanceKm,
  useAutoCalloutUrgency,
} from "@/lib/callout/use-auto-urgency";
import type { ProService } from "@/lib/types";
import {
  canFindPro,
  canOpenEmergencyCard,
  talkBoxAfterTradePick,
  type HelpStep,
} from "@/components/home/need-help-steps";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import { useSavedVehicles } from "@/components/home/shared/use-saved-vehicles";
import { NeedHelpActions } from "./need-help-dialogue/need-help-actions";
import { NeedHelpStepBody } from "./need-help-dialogue/need-help-step-body";

/**
 * One card at a time. SSPE finds the Repair Pro after they finish.
 */
export function NeedHelpDialogue({ isLight }: { isLight: boolean }) {
  const router = useRouter();
  const {
    category,
    location,
    userProfile,
    backendUserId,
    radiusKm,
    isAuthenticated,
    helpingSomeoneElse,
    helpingSomeoneLabel,
    visibleTechnicians,
  } = useApp();

  const statedTrade = talkBoxAfterTradePick(category) ? category : null;
  const needsVehicle = isAutomotiveTrade(statedTrade);

  const [problem, setProblem] = useState("");
  const [step, setStep] = useState<HelpStep>("help");
  const [chosenTrade, setChosenTrade] = useState<ProService | null>(null);
  const autoTrade = chosenTrade ?? statedTrade;
  const { urgency, setUrgency, resetUrgency } = useAutoCalloutUrgency({
    unsafe: false,
    distanceKm: nearestProDistanceKm(
      visibleTechnicians,
      autoTrade ? [autoTrade] : [],
    ),
  });
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { savedVehicles, saveVehicle } = useSavedVehicles();

  const decision = useMemo(
    () => decideHelpTrade(problem, statedTrade),
    [problem, statedTrade],
  );

  useEffect(() => {
    setProblem("");
    setStep(isAutomotiveTrade(statedTrade) ? "vehicle" : "help");
    setChosenTrade(null);
    resetUrgency();
    setVehicleLabel("");
    setError(null);
  }, [statedTrade, resetUrgency]);

  const goAfterHelp = () => {
    if (!canOpenEmergencyCard(problem)) {
      setError("A few words is enough.");
      return;
    }
    setError(null);
    if (decision.needsConfirm) {
      setStep("confirm");
      return;
    }
    setChosenTrade(statedTrade);
    setStep("urgency");
  };

  const acceptSuggested = () => {
    setChosenTrade(decision.suggested);
    setStep("urgency");
  };

  const keepTappedTrade = () => {
    setChosenTrade(statedTrade);
    setStep("urgency");
  };

  const goBack = () => {
    setError(null);
    if (step === "send") {
      setStep("urgency");
      return;
    }
    if (step === "urgency") {
      setStep(decision.needsConfirm ? "confirm" : "help");
      return;
    }
    if (step === "confirm") {
      setStep("help");
      return;
    }
    if (step === "help" && needsVehicle) setStep("vehicle");
  };

  const send = async () => {
    if (!canFindPro(step)) return;
    const text = problem.trim();
    if (!isAuthenticated) {
      router.push("/login/role");
      return;
    }
    const motoristId = backendUserId || userProfile?.identityId || "";
    if (!motoristId) {
      router.push("/login/role");
      return;
    }
    const payload = {
      motoristId,
      motoristName: userProfile?.fullName || "Customer",
      motoristPhoto: userProfile?.avatarUrl || null,
      serviceType: chosenTrade || statedTrade || decision.suggested,
      motoristVehicle: needsVehicle ? vehicleLabel || null : null,
      problem: text,
      emergency: urgency === "emergency",
      calloutUrgency: urgency,
      currency: "NGN",
      locationLabel: helpingSomeoneElse
        ? helpingSomeoneLabel || location.label
        : location.label,
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
      radiusKm,
    };
    setError(null);
    // Instant paint: hand the payload to /jobs/new (optimistic) and create the
    // job there in the background. Fall back to POST-first if the payload can't
    // be stashed (e.g. sessionStorage quota).
    let preloaded = false;
    try {
      window.sessionStorage.setItem("ona-new-request", JSON.stringify(payload));
      preloaded = true;
    } catch {
      /* fall through to POST-first */
    }
    if (preloaded) {
      router.replace("/jobs/new");
      return;
    }
    setBusy(true);
    const res = await apiCreateJob(payload);
    setBusy(false);
    if (!res.ok) {
      setError(res.message || "Could not send. Try again.");
      return;
    }
    try {
      window.sessionStorage.setItem(
        `ona-seed-job:${res.data.job.id}`,
        JSON.stringify(res.data.job),
      );
    } catch {
      /* ignore */
    }
    router.replace(`/jobs/${res.data.job.id}`);
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-hidden px-4 pb-4 pt-3">
      <NeedHelpStepBody
        isLight={isLight}
        step={step}
        setStep={setStep}
        setError={setError}
        savedVehicles={savedVehicles}
        saveVehicle={saveVehicle}
        vehicleLabel={vehicleLabel}
        setVehicleLabel={setVehicleLabel}
        problem={problem}
        setProblem={setProblem}
        statedTrade={statedTrade}
        chosenTrade={chosenTrade}
        decision={decision}
        acceptSuggested={acceptSuggested}
        keepTappedTrade={keepTappedTrade}
        urgency={urgency}
        setUrgency={setUrgency}
      />

      {error ? (
        <p className="mt-1 shrink-0 text-[12px] font-semibold text-ona-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-auto shrink-0 pt-2">
        <NeedHelpActions
          isLight={isLight}
          step={step}
          needsVehicle={needsVehicle}
          problem={problem}
          busy={busy}
          goBack={goBack}
          goAfterHelp={goAfterHelp}
          goToSend={() => {
            setError(null);
            setStep("send");
          }}
          send={send}
        />
      </div>
    </div>
  );
}
