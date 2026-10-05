"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { HelpFlowProps } from "@/components/home/help-flow";

/**
 * Question flows load on demand (only when the matching trade is tapped), so
 * the home shell first paint does not download all 14 flow bundles.
 */
const MechanicHelpFlow = dynamic(
  () =>
    import("@/components/home/mechanic-help-flow").then(
      (m) => m.MechanicHelpFlow,
    ),
  { ssr: false },
);
const VulcanizerHelpFlow = dynamic(
  () =>
    import("@/components/home/vulcanizer-help-flow").then(
      (m) => m.VulcanizerHelpFlow,
    ),
  { ssr: false },
);
const TowHelpFlow = dynamic(
  () => import("@/components/home/tow-help-flow").then((m) => m.TowHelpFlow),
  { ssr: false },
);
const BatteryHelpFlow = dynamic(
  () =>
    import("@/components/home/battery-help-flow").then(
      (m) => m.BatteryHelpFlow,
    ),
  { ssr: false },
);
const AcHelpFlow = dynamic(
  () => import("@/components/home/ac-help-flow").then((m) => m.AcHelpFlow),
  { ssr: false },
);
const BodyHelpFlow = dynamic(
  () => import("@/components/home/body-help-flow").then((m) => m.BodyHelpFlow),
  { ssr: false },
);
const ElectricalHelpFlow = dynamic(
  () =>
    import("@/components/home/electrical-help-flow").then(
      (m) => m.ElectricalHelpFlow,
    ),
  { ssr: false },
);
const DiagnosticsHelpFlow = dynamic(
  () =>
    import("@/components/home/diagnostics-help-flow").then(
      (m) => m.DiagnosticsHelpFlow,
    ),
  { ssr: false },
);
const FashionHelpFlow = dynamic(
  () =>
    import("@/components/home/fashion-help-flow").then(
      (m) => m.FashionHelpFlow,
    ),
  { ssr: false },
);
const PlumberHelpFlow = dynamic(
  () =>
    import("@/components/home/plumber-help-flow").then(
      (m) => m.PlumberHelpFlow,
    ),
  { ssr: false },
);
const CarpenterHelpFlow = dynamic(
  () =>
    import("@/components/home/carpenter-help-flow").then(
      (m) => m.CarpenterHelpFlow,
    ),
  { ssr: false },
);
const PainterHelpFlow = dynamic(
  () =>
    import("@/components/home/painter-help-flow").then(
      (m) => m.PainterHelpFlow,
    ),
  { ssr: false },
);
const SolarHelpFlow = dynamic(
  () =>
    import("@/components/home/solar-help-flow").then((m) => m.SolarHelpFlow),
  { ssr: false },
);
const GeneratorHelpFlow = dynamic(
  () =>
    import("@/components/home/generator-help-flow").then(
      (m) => m.GeneratorHelpFlow,
    ),
  { ssr: false },
);

/** Trade category -> its on-demand question flow. */
const FLOW_BY_CATEGORY: Record<string, ComponentType<HelpFlowProps>> = {
  mechanic: MechanicHelpFlow,
  vulcanizer: VulcanizerHelpFlow,
  towing: TowHelpFlow,
  battery: BatteryHelpFlow,
  ac: AcHelpFlow,
  body: BodyHelpFlow,
  electrical: ElectricalHelpFlow,
  diagnostics: DiagnosticsHelpFlow,
  fashion: FashionHelpFlow,
  plumber: PlumberHelpFlow,
  carpenter: CarpenterHelpFlow,
  painter: PainterHelpFlow,
  solar: SolarHelpFlow,
  generator: GeneratorHelpFlow,
};

/** True when `category` (customer mode) has its own dedicated question flow. */
export function hasHelpFlow(category: string, isProMode: boolean): boolean {
  return !isProMode && Object.hasOwn(FLOW_BY_CATEGORY, category);
}

export function HelpFlowOutlet({
  category,
  isLight,
  onExit,
}: {
  category: string;
  isLight: boolean;
  onExit: () => void;
}) {
  const Flow = FLOW_BY_CATEGORY[category];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Flow isLight={isLight} onExit={onExit} />
    </div>
  );
}
