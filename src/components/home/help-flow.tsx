"use client";

import { useEffect, useRef, useState } from "react";
import type { JobMedia } from "@/lib/jobs/types";
import {
  nearestProDistanceKm,
  useAutoCalloutUrgency,
} from "@/lib/callout/use-auto-urgency";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { useSavedVehicles } from "@/components/home/shared/use-saved-vehicles";
import { useApp } from "@/lib/store";
import type { ProService } from "@/lib/types";
import type { PickedLocation } from "@/components/map/location-picker-map";
import type {
  HelpFlowConfig,
  BaseRoute,
  ExtraSnapshot,
} from "./help-flow-configs";
import { FlowFinalStep } from "./help-flow/flow-final-step";
import { FlowProgressBar } from "./help-flow/flow-progress-bar";
import { FlowVehicleStep } from "./help-flow/flow-vehicle-step";
import { FlowQuestionStep } from "./help-flow/flow-question-step";
import { flowStyles, flowTag } from "./help-flow/flow-styles";
import type { FlowDir } from "./help-flow/types";
import { useAdvanceTimer } from "./help-flow/use-advance-timer";
import { useFlowNavigation } from "./help-flow/use-flow-navigation";
import { useFlowPhotos } from "./help-flow/use-flow-photos";
import { useFlowSend } from "./help-flow/use-flow-send";
import { useFlowSession } from "./help-flow/use-flow-session";

export interface HelpFlowProps {
  isLight: boolean;
  onExit?: () => void;
}

export function HelpFlow({
  config,
  isLight,
  onExit,
}: HelpFlowProps & { config: HelpFlowConfig }) {
  const { location, userProfile, backendUserId, visibleTechnicians } = useApp();

  /* ---- core state ------------------------------------------------------- */
  const [stack, setStack] = useState<string[]>(() =>
    config.hasVehicleStep ? ["vehicle"] : [...config.defaultStack],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [dir, setDir] = useState<FlowDir>("fwd");
  const [photos, setPhotos] = useState<JobMedia[]>([]);
  const [voiceNote, setVoiceNote] = useState<JobMedia | null>(null);
  const [landmark, setLandmark] = useState(location.label || "");
  const [extra, setExtra] = useState("");
  const [finalStep, setFinalStep] = useState(config.finalSteps[0] ?? "urgency");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useFeedbackToast("", error ?? "");
  const photoRef = useRef<HTMLInputElement>(null);
  const [pickedLoc, setPickedLoc] = useState<PickedLocation | null>(null);

  /* ---- vehicle state (only when hasVehicleStep) ------------------------- */
  const [vehicleLabel, setVehicleLabel] = useState("");
  const { manualVehicles, setManualVehicles, savedVehicles, saveVehicle } =
    useSavedVehicles();

  /* ---- route state (only when resolveRoute provided) -------------------- */
  const [route, setRoute] = useState<BaseRoute | null>(null);
  const [chosenTrade, setChosenTrade] = useState<ProService>(
    config.defaultTrade,
  );

  /* ---- urgency ---------------------------------------------------------- */
  const proDistanceKm = nearestProDistanceKm(
    visibleTechnicians,
    config.nearestProServices,
  );
  const { urgency, setUrgency, restoreUrgency } = useAutoCalloutUrgency({
    unsafe: config.computeUnsafe ? config.computeUnsafe(answers) : false,
    distanceKm: proDistanceKm,
  });

  /* ---- extra trade-specific state (generic bag) ------------------------- */
  const [extraState, setExtraState] = useState<ExtraSnapshot>({});

  /* ---- helpers ---------------------------------------------------------- */
  const { advanceTimerRef, clearAdvanceTimer } = useAdvanceTimer();

  const step = stack[stack.length - 1] || "start";
  const screen = config.screen(step);
  const styles = flowStyles(isLight);
  const tag = flowTag(chosenTrade);

  useEffect(() => {
    setLandmark((prev) => prev || location.label || "");
  }, [location.label]);

  /* ---- session restore + persist ---------------------------------------- */
  useFlowSession({
    config,
    locationLabel: location.label,
    stack,
    setStack,
    answers,
    setAnswers,
    draft,
    setDraft,
    setDir,
    photos,
    setPhotos,
    voiceNote,
    setVoiceNote,
    landmark,
    setLandmark,
    extra,
    setExtra,
    finalStep,
    setFinalStep,
    pickedLoc,
    setPickedLoc,
    vehicleLabel,
    setVehicleLabel,
    manualVehicles,
    setManualVehicles,
    route,
    setRoute,
    chosenTrade,
    setChosenTrade,
    urgency,
    restoreUrgency,
    extraState,
    setExtraState,
  });

  /* ---- navigation ------------------------------------------------------- */
  const {
    handleExit,
    push,
    pick,
    submitText,
    goBack,
    acceptRoute,
    nextFinal,
    finalBack,
  } = useFlowNavigation({
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
  });

  /* ---- photos ----------------------------------------------------------- */
  const { onPhotos } = useFlowPhotos({
    config,
    photos,
    setPhotos,
    setFinalStep,
    setError,
    advanceTimerRef,
    clearAdvanceTimer,
  });

  /* ---- send ------------------------------------------------------------- */
  const { send } = useFlowSend({
    config,
    answers,
    extra,
    landmark,
    vehicleLabel,
    photos,
    voiceNote,
    pickedLoc,
    urgency,
    extraState,
    setBusy,
    setError,
  });

  /* ---- send readiness --------------------------------------------------- */
  const canSend = config.computeCanSend
    ? config.computeCanSend({ finalStep, photos, extraState, answers })
    : photos.length >= config.minPhotos;

  /* ---- auto-advance on location pick ------------------------------------ */
  useEffect(() => {
    if (step === "final" && finalStep === "location" && pickedLoc) {
      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        void send();
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, finalStep, pickedLoc]);

  /* ---- progress bar ----------------------------------------------------- */
  const finalStepIndex = config.finalSteps.indexOf(finalStep);
  const progressIndex =
    step === "final" && finalStepIndex >= 0 ? finalStepIndex : -1;

  return (
    <div className="ona2 om-mech-enter flex h-full min-h-0 flex-col overflow-hidden px-4 pb-4 pt-3">
      <FlowProgressBar
        config={config}
        stackLength={stack.length}
        step={step}
        progressIndex={progressIndex}
      />

      {/* Vehicle step */}
      {config.hasVehicleStep && step === "vehicle" ? (
        <FlowVehicleStep
          isLight={isLight}
          tag={tag}
          savedVehicles={savedVehicles}
          saveVehicle={saveVehicle}
          vehicleLabel={vehicleLabel}
          setVehicleLabel={setVehicleLabel}
          setError={setError}
          answers={answers}
          push={push}
          onBack={() => (stack.length > 1 ? goBack() : handleExit())}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {step === "final" ? (
            <FlowFinalStep
              config={config}
              isLight={isLight}
              styles={styles}
              tag={tag}
              tradeId={chosenTrade}
              distanceKm={proDistanceKm}
              finalStep={finalStep}
              photos={photos}
              setPhotos={setPhotos}
              photoRef={photoRef}
              onPhotos={onPhotos}
              voiceNote={voiceNote}
              setVoiceNote={setVoiceNote}
              voiceUserId={backendUserId || userProfile?.identityId || "guest"}
              pickedLoc={pickedLoc}
              setPickedLoc={setPickedLoc}
              landmark={landmark}
              setLandmark={setLandmark}
              urgency={urgency}
              setUrgency={setUrgency}
              extraState={extraState}
              setExtraState={setExtraState}
              answers={answers}
              setError={setError}
              busy={busy}
              canSend={canSend}
              nextFinal={nextFinal}
              finalBack={finalBack}
              send={send}
            />
          ) : (
            <FlowQuestionStep
              config={config}
              styles={styles}
              tag={tag}
              step={step}
              dir={dir}
              screen={screen}
              draft={draft}
              setDraft={setDraft}
              setError={setError}
              submitText={submitText}
              pick={pick}
              route={route}
              chosenTrade={chosenTrade}
              acceptRoute={acceptRoute}
              stackLength={stack.length}
              goBack={goBack}
            />
          )}
        </div>
      )}
    </div>
  );
}
