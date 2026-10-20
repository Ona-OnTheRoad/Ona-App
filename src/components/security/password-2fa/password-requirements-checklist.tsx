"use client";

import { Check, X } from "lucide-react";
import { passwordChecklist } from "@/lib/signup-validation";

interface PasswordRequirementsChecklistProps {
  password: string;
}

export function PasswordRequirementsChecklist({
  password,
}: PasswordRequirementsChecklistProps) {
  const items = passwordChecklist(password);

  return (
    <div className="space-y-2 pt-1 pb-1">
      <p className="text-[14px] font-bold text-ona-ink">
        Password requirements:
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 text-[13px] font-medium transition-colors ${
              item.ok
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-ona-muted"
            }`}
          >
            {item.ok ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            ) : (
              <X className="h-4 w-4 shrink-0 text-ona-muted/70" strokeWidth={2.2} />
            )}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
