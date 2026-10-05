import type { HelpFlowConfig } from "./help-flow-configs/types";
import { towConfig } from "./help-flow-configs/tow";
import { mechanicConfig } from "./help-flow-configs/mechanic";
import { batteryConfig } from "./help-flow-configs/battery";
import { bodyConfig } from "./help-flow-configs/body";
import { vulcanizerConfig } from "./help-flow-configs/vulcanizer";
import { acConfig } from "./help-flow-configs/ac";
import { electricalConfig } from "./help-flow-configs/electrical";
import { diagnosticsConfig } from "./help-flow-configs/diagnostics";
import { solarConfig } from "./help-flow-configs/solar";
import { generatorConfig } from "./help-flow-configs/generator";
import { plumberConfig } from "./help-flow-configs/plumber";
import { carpenterConfig } from "./help-flow-configs/carpenter";
import { painterConfig } from "./help-flow-configs/painter";
import { fashionConfig } from "./help-flow-configs/fashion";

export type {
  BaseRoute,
  ExtraSnapshot,
  ScreenFn,
  NextScreenFn,
  CanAdvanceTextFn,
  ComposeProblemFn,
  ResolveRouteFn,
  ApplyConfirmFn,
  ConfirmQuestionFn,
  UrgencyChip,
  BuildPayloadInput,
  BuildPayloadResult,
  OnPushFn,
  OnAcceptRouteFn,
  OnPickFn,
  HelpFlowConfig,
} from "./help-flow-configs/types";

export const helpFlowConfigs: Record<string, HelpFlowConfig> = {
  tow: towConfig,
  mechanic: mechanicConfig,
  battery: batteryConfig,
  body: bodyConfig,
  vulcanizer: vulcanizerConfig,
  ac: acConfig,
  electrical: electricalConfig,
  diagnostics: diagnosticsConfig,
  solar: solarConfig,
  generator: generatorConfig,
  plumber: plumberConfig,
  carpenter: carpenterConfig,
  painter: painterConfig,
  fashion: fashionConfig,
};
