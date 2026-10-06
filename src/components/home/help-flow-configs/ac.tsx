
import {
  acScreen,
  nextAcScreen,
  composeAcProblem,
  canAdvanceText as acCanAdvance,
  AC_START_OPTIONS,
  AC_MAX_PHOTOS,
  AC_FINAL_COPY,
} from "@/lib/ac/question-tree";
import { makeUrgencyChips, defaultBuildPayload } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, HelpFlowConfig } from "./types";

export const acConfig: HelpFlowConfig = {
  sessionKey: "ona-ac-flow-session",
  screen: acScreen as ScreenFn,
  nextScreen: nextAcScreen as NextScreenFn,
  canAdvanceText: acCanAdvance as CanAdvanceTextFn,
  composeProblem: composeAcProblem as ComposeProblemFn,
  startOptions: AC_START_OPTIONS,
  hasVehicleStep: true,
  defaultStack: ["unit"],
  defaultTrade: "ac",
  nearestProServices: ["ac"],
  urgencyChips: makeUrgencyChips(AC_FINAL_COPY),
  maxPhotos: AC_MAX_PHOTOS,
  minPhotos: 0,
  finalSteps: ["urgency", "photos", "voice", "location"],
  finalCopy: {
    urgency: AC_FINAL_COPY.urgency,
    photos: AC_FINAL_COPY.photos,
    voice: AC_FINAL_COPY.voice,
    location: AC_FINAL_COPY.location,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => defaultBuildPayload("ac", composeAcProblem as ComposeProblemFn, ctx),
};
