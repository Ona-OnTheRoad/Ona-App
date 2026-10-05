import { AppleProOptionRow } from "@/components/pro/apple-pro-wizard";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Step 2: specialty (hairline list). */
export function StepSpecialty({
  skill,
  specialty,
  options,
  isLight,
  onSelect,
}: {
  skill: ProService;
  specialty: string | null;
  options: string[];
  isLight: boolean;
  onSelect: (s: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-1">
      <p
        className={cn(
          "mb-2 text-[14px] font-medium leading-snug",
          isLight ? "text-slate-600" : "text-white/55",
        )}
      >
        Where do you mainly work as a{" "}
        <span
          className={cn(
            "font-semibold",
            isLight ? "text-[#1c1c1e]" : "text-white",
          )}
        >
          {PRO_SERVICE_LABELS[skill]}
        </span>
        ?
      </p>
      <ul className="flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0 pb-2 scrollbar-hide">
        {options.map((s) => {
          const on = specialty === s;
          return (
            <li key={s} className="shrink-0">
              <AppleProOptionRow
                active={on}
                isLight={isLight}
                onClick={() => onSelect(s)}
              >
                <span
                  className={cn(
                    "text-[16px] font-semibold",
                    isLight ? "text-[#1c1c1e]" : "text-white",
                  )}
                >
                  {s}
                </span>
              </AppleProOptionRow>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
