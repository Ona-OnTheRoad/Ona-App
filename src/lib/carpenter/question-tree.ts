/** Deep cascading question flow for the Furniture / Carpentry trade. */
export {
  CARPENTER_START_QUESTION,
  CARPENTER_MIN_PHOTOS,
  CARPENTER_MAX_PHOTOS,
  CARPENTER_START_OPTIONS,
  CARPENTER_FINAL_COPY,
  CARPENTER_MEASUREMENTS_OPTIONS,
} from "./question-tree/constants";
export type { CarpenterOption, CarpenterScreen } from "./question-tree/types";
export { CARPENTER_SCREENS } from "./question-tree/screens";
export {
  carpenterScreen,
  nextCarpenterScreen,
} from "./question-tree/navigation";
export {
  resolveCarpenterRoute,
  canAdvanceText,
  canFindCarpenterPro,
  composeCarpenterJob,
  carpenterBreadcrumb,
} from "./question-tree/helpers";
