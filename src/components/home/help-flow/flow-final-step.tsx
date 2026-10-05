"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { ChevronRight } from "lucide-react";
import { VoiceNoteRecorder } from "@/components/jobs/voice-note-recorder";
import type { JobMedia } from "@/lib/jobs/types";
import type { CalloutUrgencyKind } from "@/lib/callout/urgency";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/map/address-autocomplete";
import type { PickedLocation } from "@/components/map/location-picker-map";
import type { ExtraSnapshot, HelpFlowConfig } from "../help-flow-configs";
import type { FlowStyles } from "./types";

export function FlowFinalStep({
  config,
  isLight,
  styles,
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
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        {/* Title */}
        <div className="mb-1 mt-2 flex items-center gap-1 px-0.5">
          {finalStep !== "urgency" &&
          finalStep !== config.finalSteps[config.finalSteps.length - 1] ? (
            <button
              type="button"
              onClick={nextFinal}
              disabled={
                finalStep === "photos" && photos.length < config.minPhotos
              }
              aria-label="Next"
              className="border-0 bg-transparent p-1 text-[#FF6B35] disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
            </button>
          ) : null}
          <p
            className={cn("text-[14px] font-bold capitalize leading-snug", ink)}
          >
            {config.finalCopy[finalStep] ?? finalStep}
          </p>
        </div>

        <div className={cn("rounded-[4px] px-3 py-2.5", rowCard)}>
          {/* Urgency */}
          {finalStep === "urgency" ? (
            <div className="flex flex-col gap-1.5">
              {config.urgencyChips.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setUrgency(opt.id);
                    setError(null);
                    nextFinal();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md border-0 px-3 py-2.5 text-left transition-transform duration-150 active:scale-[0.985]",
                    urgency === opt.id ? "bg-[#FF6B35]/10" : "bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "text-[13px] font-bold",
                      urgency === opt.id ? "text-[#FF6B35]" : ink,
                    )}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      urgency === opt.id ? "text-[#FF6B35]" : muted,
                    )}
                  >
                    {opt.fee}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

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
                    className="h-12 w-12 overflow-hidden rounded-lg border-0 p-0"
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
                      "h-12 w-12 rounded-lg border-0 text-[18px] font-bold",
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
              leading={
                <button
                  type="button"
                  onClick={nextFinal}
                  aria-label="Next"
                  className="border-0 bg-transparent p-1 text-[#FF6B35]"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                </button>
              }
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

        {error ? (
          <p className="mt-1 text-[12px] font-semibold text-red-500">{error}</p>
        ) : null}
      </div>

      {/* Footer buttons */}
      <div className="flex shrink-0 flex-col gap-2 pt-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={finalBack}
            className={cn(
              "h-11 flex-1 rounded-md border-0 text-[14px] font-bold",
              actionFlat,
            )}
          >
            Back
          </button>
          <button
            type="button"
            disabled={busy || !canSend}
            onClick={() => void send()}
            className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white disabled:opacity-50"
          >
            {busy ? `${config.busyLabel}…` : config.sendLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
