
import {
  mechanicScreen,
  nextMechanicScreen,
  composeMechanicProblem,
  canAdvanceText as mechCanAdvance,
  MECHANIC_START_OPTIONS,
  MECHANIC_MAX_PHOTOS,
  MECHANIC_FINAL_COPY,
  resolveMechanicRoute,
  applyConfirmChoice as mechApplyConfirm,
  confirmQuestion as mechConfirmQuestion,
} from "@/lib/mechanic/question-tree";
import { makeUrgencyChips, defaultBuildPayload } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, ResolveRouteFn, ApplyConfirmFn, ConfirmQuestionFn, HelpFlowConfig } from "./types";

export const mechanicConfig: HelpFlowConfig = {
  sessionKey: "ona-mech-flow-session",
  screen: mechanicScreen as ScreenFn,
  nextScreen: nextMechanicScreen as NextScreenFn,
  canAdvanceText: mechCanAdvance as CanAdvanceTextFn,
  composeProblem: composeMechanicProblem as ComposeProblemFn,
  startOptions: MECHANIC_START_OPTIONS,
  resolveRoute: resolveMechanicRoute as unknown as ResolveRouteFn,
  applyConfirmChoice: mechApplyConfirm as unknown as ApplyConfirmFn,
  confirmQuestion: mechConfirmQuestion as unknown as ConfirmQuestionFn,
  hasVehicleStep: true,
  defaultStack: ["vehicle"],
  defaultTrade: "mechanic",
  nearestProServices: ["mechanic"],
  urgencyChips: makeUrgencyChips(MECHANIC_FINAL_COPY),
  maxPhotos: MECHANIC_MAX_PHOTOS,
  minPhotos: 0,
  computeUnsafe: (answers) =>
    ["c_safe", "d_safe", "f_safe"].some((k) => answers[k] === "no"),
  finalSteps: ["urgency", "photos", "voice", "location"],
  finalCopy: {
    urgency: MECHANIC_FINAL_COPY.urgency,
    photos: MECHANIC_FINAL_COPY.photos,
    voice: MECHANIC_FINAL_COPY.voice,
    location: MECHANIC_FINAL_COPY.location,
  },
  progressDefaultTotal: 10,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => defaultBuildPayload("mechanic", composeMechanicProblem as ComposeProblemFn, ctx),
};
