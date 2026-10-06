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
  return (
    <div className="mb-1.5 h-0.5 shrink-0 overflow-hidden rounded-full">
      <div
        className="h-full rounded-full bg-brand"
        style={{
          width: `${(() => {
            const N = config.finalSteps.length;
            const base = Math.max(0, stackLength - 1);
            const atFinal = step === "final";
            const pos = atFinal
              ? base + (progressIndex >= 0 ? progressIndex : 0)
              : base;
            const total = atFinal ? base + N - 1 : config.progressDefaultTotal;
            return Math.min(100, (pos / total) * 100);
          })()}%`,
        }}
      />
    </div>
  );
}
