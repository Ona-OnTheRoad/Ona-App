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
    <div className="space-y-2 dark:space-y-0">
      <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted dark:hidden">
        Money
      </p>
      <div className="rounded-ona-ctl dark:rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent overflow-hidden shadow-xs">
        <p className="hidden dark:block px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
          Money
        </p>
        <div>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-4 dark:px-0 dark:mx-4 border-b border-ona-border dark:border-[#18181B] py-3.5 last:border-b-0 no-underline transition-colors hover:bg-ona-field/50 active:bg-ona-field dark:hover:bg-transparent dark:active:bg-transparent dark:hover:opacity-85 dark:active:opacity-75"
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-[12px] font-medium text-ona-ink dark:text-[#D1D5DB] leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                  {item.subtitle}
                </p>
              </div>
              <ChevronRight
                className="h-5 w-5 text-ona-muted shrink-0"
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
