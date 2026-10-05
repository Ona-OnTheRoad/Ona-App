export {
  VULCANIZER_START_QUESTION,
  VULCANIZER_FINAL_COPY,
  VULCANIZER_MIN_PHOTOS,
  VULCANIZER_MAX_PHOTOS,
  VULCANIZER_START_OPTIONS,
} from "./question-tree/constants";
export type {
  VulcanizerScreenKind,
  VulcanizerOption,
  VulcanizerScreen,
  VulcanizerRoute,
} from "./question-tree/types";
export { VULCANIZER_SCREENS } from "./question-tree/screens";
export {
  vulcanizerScreen,
  nextVulcanizerScreen,
} from "./question-tree/navigation";
export { vulcanizerDiagnosis } from "./question-tree/diagnosis";
export {
  resolveVulcanizerRoute,
  applyVulcanizerConfirmChoice,
} from "./question-tree/route";
export {
  composeVulcanizerProblem,
  canFindVulcanizerPro,
} from "./question-tree/compose";

export { canAdvanceText, confirmQuestion } from "@/lib/mechanic/question-tree";
