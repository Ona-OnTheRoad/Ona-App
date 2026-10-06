"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronRight } from "lucide-react";
import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { BaseRoute, HelpFlowConfig } from "../help-flow-configs";
import type { FlowDir, FlowStyles } from "./types";

export function FlowQuestionStep({
  config,
  styles,
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
  const { ink, muted, field, rowCard, chipIdle, actionFlat } = styles;
  return (
    <>
      {/* Question / confirm screen */}
      <div
        key={`${step}-${dir}`}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide",
          dir === "back" ? "om-mech-slide-back" : "om-mech-slide-fwd",
        )}
      >
        {screen ? (
          <>
            <div className="mt-2 flex items-center gap-1 px-0.5 pb-2">
              {screen.kind === "text" ? (
                <button
                  type="button"
                  disabled={!config.canAdvanceText(draft)}
                  onClick={submitText}
                  aria-label="Next"
                  className="border-0 bg-transparent p-0.5 text-[#FF6B35] disabled:opacity-40"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                </button>
              ) : null}
              <p
                className={cn(
                  "text-[14px] font-bold capitalize leading-snug",
                  ink,
                )}
              >
                {screen.question}
              </p>
            </div>
            {screen.kind === "choice" ? (
              <div className="flex flex-col gap-1">
                {(screen.options || []).map((opt, i) => {
                  const letter =
                    step === "start"
                      ? (config.startOptions ?? [])[i]?.id
                      : undefined;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => pick(opt.id, opt.label)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[4px] border-0 px-1 py-3 text-left transition-transform duration-150 active:scale-[0.985]",
                        rowCard,
                      )}
                    >
                      {letter ? (
                        <span
                          className={cn(
                            "w-5 shrink-0 text-[12px] font-bold",
                            muted,
                          )}
                        >
                          {letter}.
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-[13px] font-semibold capitalize leading-snug",
                          ink,
                        )}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                rows={3}
                placeholder={screen.placeholder}
                className={cn(
                  "w-full resize-none rounded-xl border-0 px-3 py-2 text-[13px] font-medium leading-snug outline-none",
                  field,
                )}
              />
            )}
          </>
        ) : null}

        {/* Confirm screen */}
        {step === "confirm" && route && config.confirmQuestion ? (
          <div>
            <p className={cn("text-[14px] font-bold", ink)}>
              {config.confirmQuestion(chosenTrade)}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => acceptRoute(true)}
                className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => acceptRoute(false)}
                className={cn(
                  "h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]",
                  chipIdle,
                )}
              >
                No
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-1 text-[12px] font-semibold text-red-500">{error}</p>
        ) : null}
      </div>

      {/* Back button */}
      {stackLength > 1 ? (
        <div className="mt-auto flex shrink-0 gap-2 pt-2">
          <button
            type="button"
            onClick={goBack}
            className={cn(
              "h-11 w-full rounded-md border-0 text-[14px] font-bold",
              actionFlat,
            )}
          >
            Back
          </button>
        </div>
      ) : null}
    </>
  );
}
