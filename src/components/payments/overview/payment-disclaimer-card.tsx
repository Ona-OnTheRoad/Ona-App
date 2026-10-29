"use client";

import { Info } from "lucide-react";

interface PaymentDisclaimerCardProps {
  message: string;
}

export function PaymentDisclaimerCard({ message }: PaymentDisclaimerCardProps) {
  return (
    <div className="rounded-ona-ctl dark:rounded-ona-card bg-ona-field/80 dark:bg-ona-field border border-ona-border p-4 flex items-start dark:items-center gap-3 shadow-xs">
      <Info className="h-5 w-5 text-ona-ink dark:text-ona-muted shrink-0 mt-0.5 dark:mt-0" strokeWidth={2} />
      <p className="text-[12px] font-normal text-ona-ink dark:text-ona-muted leading-relaxed">
        {message}
      </p>
    </div>
  );
}
