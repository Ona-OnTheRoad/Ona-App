"use client";

import { Info } from "lucide-react";

interface PaymentDisclaimerCardProps {
  message: string;
}

export function PaymentDisclaimerCard({ message }: PaymentDisclaimerCardProps) {
  return (
    <div className="rounded-ona-ctl bg-ona-field/80 border border-ona-border p-4 flex items-start gap-3 shadow-xs">
      <Info className="h-5 w-5 text-ona-ink shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-[12px] font-normal text-ona-ink leading-relaxed">
        {message}
      </p>
    </div>
  );
}
