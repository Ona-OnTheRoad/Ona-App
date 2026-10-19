"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { VoiceNoteRecorder } from "@/components/jobs/voice-note-recorder";
import type { JobMedia } from "@/lib/jobs/types";
import type { CalloutUrgencyKind } from "@/lib/callout/urgency";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { OnaFlowHeader } from "@/components/ui/ona-flow-header";
import type { ProService } from "@/lib/types";
import { CALLOUT_URGENCY_OPTIONS } from "@/lib/callout/urgency";
import { FlowCalloutCard, previewCallout } from "./flow-callout-card";
import { FlowUrgencyList } from "./flow-urgency-list";
import { AddressAutocomplete } from "@/components/map/address-autocomplete";
import type { PickedLocation } from "@/components/map/location-picker-map";
import type { ExtraSnapshot, HelpFlowConfig } from "../help-flow-configs";
import type { FlowStyles } from "./types";

export function FlowFinalStep({
  config,
  isLight,
  styles,
  tag,
  tradeId,
  distanceKm,
  finalStep,
  photos,
  setPhotos,
  photoRef,
  onPhotos,
  voiceNote,
  setVoiceNote,
  voiceUserId,
  pickedLoc,
  setPickedLoc,
  landmark,
  setLandmark,
  urgency,
  setUrgency,
  extraState,
  setExtraState,
  answers,
  error,
  setError,
  busy,
  canSend,
  nextFinal,
  finalBack,
  send,
}: {
  config: HelpFlowConfig;
  isLight: boolean;
  styles: FlowStyles;
  tag: string;
  tradeId: ProService;
  distanceKm: number | null;
  finalStep: string;
  photos: JobMedia[];
  setPhotos: Dispatch<SetStateAction<JobMedia[]>>;
  photoRef: RefObject<HTMLInputElement | null>;
  onPhotos: (files: FileList | null) => Promise<void>;
  voiceNote: JobMedia | null;
  setVoiceNote: Dispatch<SetStateAction<JobMedia | null>>;
  voiceUserId: string;
  pickedLoc: PickedLocation | null;
  setPickedLoc: Dispatch<SetStateAction<PickedLocation | null>>;
  landmark: string;
  setLandmark: Dispatch<SetStateAction<string>>;
  urgency: CalloutUrgencyKind;
  setUrgency: (u: CalloutUrgencyKind) => void;
  extraState: ExtraSnapshot;
  setExtraState: Dispatch<SetStateAction<ExtraSnapshot>>;
  answers: Record<string, string>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  busy: boolean;
  canSend: boolean;
  nextFinal: () => void;
  finalBack: () => void;
  send: () => Promise<void>;
}) {
  const { ink, muted, field, rowCard, chipIdle, actionFlat } = styles;
  const steps = config.finalSteps;
  const isUrgency = finalStep === "urgency";
  const isLast = finalStep === steps[steps.length - 1];
  const hasNext = !isLast && steps.indexOf(finalStep) >= 0;
  const preview = isUrgency
    ? previewCallout(tradeId, urgency, distanceKm)
    : null;
  const urgencyLabel =
    CALLOUT_URGENCY_OPTIONS.find((o) => o.id === urgency)?.label ?? "Normal";
  const sendText = busy
    ? `${config.busyLabel}…`
    : preview
      ? `${config.sendLabel} · ${formatMoney(preview.fee.calloutFee, preview.fee.currency)}`
      : config.sendLabel;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <OnaFlowHeader
        tag={tag}
        onBack={finalBack}
        title={config.finalCopy[finalStep] ?? finalStep}
        subtitle={
          isUrgency
            ? "Your call-out price is fixed before dispatch. Labour is agreed separately with your professional."
            : undefined
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        {isUrgency ? (
          <>
            <FlowUrgencyList
              chips={config.urgencyChips}
              urgency={urgency}
              onSelect={(u) => {
                setUrgency(u);
                setError(null);
              }}
            />
            {preview ? (
              <FlowCalloutCard preview={preview} urgencyLabel={urgencyLabel} />
            ) : null}
          </>
        ) : (
          <div
            className={cn(
              "rounded-ona-card border border-ona-border px-3 py-3",
              rowCard,
            )}
          >
            {/* Photos */}
            {finalStep === "photos" ? (
              <div>
                <div className="flex flex-wrap gap-1.5">
                  {photos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setPhotos((prev) => prev.filter((x) => x.id !== p.id))
                      }
                      className="h-12 w-12 overflow-hidden rounded-ona-ctl border-0 p-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        loading="lazy"
                        decoding="async"
                        src={p.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                  {photos.length < config.maxPhotos ? (
                    <button
                      type="button"
                      onClick={() => photoRef.current?.click()}
                      className={cn(
                        "h-12 w-12 rounded-ona-ctl border-0 text-[18px] font-bold",
                        chipIdle,
                      )}
                    >
                      +
                    </button>
                  ) : null}
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void onPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            ) : null}

            {/* Voice */}
            {finalStep === "voice" ? (
              <VoiceNoteRecorder
                value={voiceNote}
                onChange={setVoiceNote}
                userId={voiceUserId}
                isLight={isLight}
              />
            ) : null}

            {/* Location */}
            {finalStep === "location" ? (
              <div className="space-y-2">
                <AddressAutocomplete
                  className="-mx-3"
                  value={pickedLoc}
                  onChange={(loc) => {
                    setPickedLoc(loc);
                    setLandmark(loc.label || landmark);
                  }}
                />
              </div>
            ) : null}

            {/* Extra final steps delegated to config */}
            {!["urgency", "photos", "voice", "location"].includes(finalStep) &&
            config.renderExtraFinalStep
              ? config.renderExtraFinalStep({
                  finalStep,
                  extraState,
                  setExtraState,
                  setError,
                  answers,
                  isLight,
                  ink,
                  muted,
                  field,
                  rowCard,
                  chipIdle,
                  actionFlat,
                })
              : null}
          </div>
        )}

        {error ? (
          <p className="mt-1 text-[12px] font-semibold text-ona-danger">
            {error}
          </p>
        ) : null}
      </div>

      {/* Pinned footer */}
      <div className="flex shrink-0 flex-col gap-2 pt-3">
        <Button
          size="ona"
          variant="ona"
          disabled={busy || !canSend}
          busy={busy}
          onClick={() => void send()}
        >
          {sendText}
        </Button>
        {hasNext ? (
          <Button
            size="ona"
            variant="onaOutline"
            onClick={nextFinal}
            aria-label="Next"
            disabled={
              finalStep === "photos" && photos.length < config.minPhotos
            }
          >
            {isUrgency ? "Add photos or details" : "Next"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
