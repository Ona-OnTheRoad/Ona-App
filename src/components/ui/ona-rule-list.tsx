import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnaRule = { ok: boolean; text: string };

/**
 * Live requirement checklist. Met rules read green with a check, unmet rules
 * stay neutral with an X (state is also in the text via sr-only, not colour alone).
 */
export function OnaRuleList({
  title,
  rules,
}: {
  title: string;
  rules: OnaRule[];
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ona-ink">{title}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {rules.map((r) => (
          <li
            key={r.text}
            className={cn(
              "flex items-center gap-2 text-[12px] font-medium",
              r.ok ? "text-ona-success" : "text-ona-muted",
            )}
          >
            {r.ok ? (
              <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <X aria-hidden className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            <span>{r.text}</span>
            <span className="sr-only">{r.ok ? "(met)" : "(not met)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
