"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { OnaFlowHeader } from "@/components/ui/ona-flow-header";
import { PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { BaseRoute, HelpFlowConfig } from "../help-flow-configs";
import type { FlowDir, FlowStyles } from "./types";

export function FlowQuestionStep({
  config,
  styles,
  tag,
  step,
  dir,
  screen,
  draft,
  setDraft,
  error,
  setError,
  submitText,
  pick,
  route,
  chosenTrade,
  acceptRoute,
  stackLength,
  goBack,
}: {
  config: HelpFlowConfig;
  styles: FlowStyles;
  tag: string;
  step: string;
  dir: FlowDir;
  screen: ReturnType<HelpFlowConfig["screen"]>;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  submitText: () => void;
  pick: (optionId: string, label: string) => void;
  route: BaseRoute | null;
  chosenTrade: ProService;
  acceptRoute: (yes: boolean) => void;
  stackLength: number;
  goBack: () => void;
}) {
  const { field } = styles;
  const isConfirm = step === "confirm" && route && config.confirmQuestion;
  const title = screen?.question
    ? screen.question
    : isConfirm
      ? config.confirmQuestion!(chosenTrade)
      : "";
  const isText = screen?.kind === "text";
  return (
    <>
      <OnaFlowHeader
        tag={tag}
        title={title}
        subtitle={
          isConfirm
            ? "Based on your answers, a different trade may be the better fit."
            : "A few quick answers help us match you with the right professional."
        }
        onBack={stackLength > 1 ? goBack : undefined}
      />
      <div
        key={`${step}-${dir}`}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide",
          dir === "back" ? "om-mech-slide-back" : "om-mech-slide-fwd",
        )}
      >
        {screen?.kind === "choice" ? (
          <div className="flex flex-col gap-2 rounded-ona-card border border-ona-border bg-ona-surface p-2">
            {(screen.options || []).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => pick(opt.id, opt.label)}
                className="flex min-h-12 w-full items-center rounded-ona-ctl border-0 bg-ona-field-strong px-3.5 py-3 text-left text-[13px] font-semibold leading-snug text-ona-ink transition-colors active:bg-ona-border"
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        {isText ? (
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            rows={4}
            aria-label={screen?.question}
            placeholder={screen?.placeholder}
            className={cn(
              "w-full resize-none rounded-ona-ctl px-3.5 py-3 text-[14px] font-medium leading-snug outline-none",
              field,
            )}
          />
        ) : null}

        {isConfirm ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-ona-card border border-ona-border bg-ona-surface px-3.5 py-3 text-[13px] font-medium leading-snug text-ona-ink">
              {`Continue to a ${PRO_SERVICE_LABELS[chosenTrade].toLowerCase()} request, or cancel to stay with your ${PRO_SERVICE_LABELS[config.defaultTrade].toLowerCase()} request.`}
            </p>
            <Button size="ona" variant="ona" onClick={() => acceptRoute(true)}>
              Continue
            </Button>
            <Button
              size="ona"
              variant="onaOutline"
              onClick={() => acceptRoute(false)}
            >
              Cancel
            </Button>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-2 text-[12px] font-semibold text-ona-danger"
          >
            {error}
          </p>
        ) : null}
      </div>

      {isText ? (
        <div className="shrink-0 pt-3">
          <Button
            size="ona"
            variant="ona"
            disabled={!config.canAdvanceText(draft)}
            onClick={submitText}
            aria-label="Next"
          >
            Next
          </Button>
        </div>
      ) : null}
    </>
  );
}
