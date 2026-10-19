import { OnaStepBars } from "@/components/ui/ona-step-bars";
import type { HelpFlowConfig } from "../help-flow-configs";

export function FlowProgressBar({
  config,
  stackLength,
  step,
  progressIndex,
}: {
  config: HelpFlowConfig;
  stackLength: number;
  step: string;
  progressIndex: number;
}) {
  const N = config.finalSteps.length;
  const base = Math.max(0, stackLength - 1);
  const atFinal = step === "final";
  const pos = atFinal ? base + (progressIndex >= 0 ? progressIndex : 0) : base;
  const total = Math.max(
    1,
    atFinal ? base + N - 1 : config.progressDefaultTotal,
  );
  const current = Math.max(1, Math.min(total, Math.round(pos)));
  return (
    <div className="mb-1 shrink-0">
      <OnaStepBars current={current} total={total} />
    </div>
  );
}
