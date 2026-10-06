/** Deep cascading question flow for the Painter trade. */
export {
  PAINTER_START_QUESTION,
  PAINTER_MIN_PHOTOS,
  PAINTER_MAX_PHOTOS,
  PAINTER_START_OPTIONS,
  PAINTER_FINAL_COPY,
  PAINTER_SUPPLY_OPTIONS,
  PAINTER_SCAFFOLD_OPTIONS,
} from "./question-tree/constants";
export type { PainterOption, PainterScreen } from "./question-tree/types";
export { PAINTER_SCREENS } from "./question-tree/screens";
export { painterScreen, nextPainterScreen } from "./question-tree/navigation";
export {
  resolvePainterRoute,
  canAdvanceText,
  canFindPainterPro,
  composePainterJob,
  painterBreadcrumb,
} from "./question-tree/helpers";
