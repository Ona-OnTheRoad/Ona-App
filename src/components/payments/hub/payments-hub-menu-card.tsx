"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface PaymentsHubMenuItem {
  title: string;
  subtitle: string;
  href: string;
}

interface PaymentsHubMenuCardProps {
  items: PaymentsHubMenuItem[];
}

export function PaymentsHubMenuCard({ items }: PaymentsHubMenuCardProps) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
        Money
      </p>
      <div className="rounded-ona-ctl border border-ona-border bg-ona-surface divide-y divide-ona-border overflow-hidden shadow-xs">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between px-4 py-3.5 no-underline transition-colors hover:bg-ona-field/50 active:bg-ona-field"
          >
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-[12px] font-medium text-ona-ink leading-snug">
                {item.title}
              </p>
              <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                {item.subtitle}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-ona-muted shrink-0" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </div>
  );
}
