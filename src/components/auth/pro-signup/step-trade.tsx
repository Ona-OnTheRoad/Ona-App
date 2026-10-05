import { AppleProOptionRow } from "@/components/pro/apple-pro-wizard";
import { PRO_TRADE_OPTIONS } from "@/lib/services";
import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Step 1: choose exactly one trade. */
export function StepTrade({
  skill,
  isLight,
  onSelect,
}: {
  skill: ProService | null;
  isLight: boolean;
  onSelect: (id: ProService) => void;
}) {
  return (
    <>
      <div className="min-h-0 w-full flex-1 overflow-y-auto scrollbar-hide">
        <ul className="flex list-none flex-col p-0">
          {PRO_TRADE_OPTIONS.map(({ id, label, icon: Icon, hint }) => {
            const active = skill === id;
            return (
              <li key={id} className="shrink-0">
                <AppleProOptionRow
                  active={active}
                  isLight={isLight}
                  onClick={() => onSelect(id)}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active
                        ? "text-[#FF6B35]"
                        : isLight
                          ? "text-slate-600"
                          : "text-white/70",
                    )}
                    strokeWidth={1.85}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[16px] font-semibold",
                        isLight ? "text-[#1c1c1e]" : "text-white",
                      )}
                    >
                      {label}
                    </span>
                    {hint ? (
                      <span
                        className={cn(
                          "mt-0.5 block text-[12px] font-medium",
                          isLight ? "text-slate-500" : "text-white/45",
                        )}
                      >
                        {hint}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      active
                        ? "border-[#FF6B35] bg-[#FF6B35] text-[8px] font-bold text-white"
                        : isLight
                          ? "border-black/20 bg-transparent"
                          : "border-white/30 bg-transparent",
                    )}
                    aria-hidden
                  >
                    {active ? "✓" : ""}
                  </span>
                </AppleProOptionRow>
              </li>
            );
          })}
        </ul>
      </div>
      <p
        className={cn(
          "mt-2 shrink-0 text-center text-[12px] font-medium",
          isLight ? "text-slate-500" : "text-white/45",
        )}
      >
        Choose only <span className="font-semibold text-[#FF6B35]">one</span>{" "}
        trade, then pick your focus
      </p>
    </>
  );
}
