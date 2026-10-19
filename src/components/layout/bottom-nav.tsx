"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Clock3, Home, UserRound } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/i18n/messages";

/** No Messages tab chat only from an active request/job. */
const items: {
  href: string;
  labelKey: MessageKey;
  icon: typeof Home;
}[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/jobs", labelKey: "nav.jobs", icon: Briefcase },
  { href: "/requests", labelKey: "nav.requests", icon: Clock3 },
  { href: "/profile", labelKey: "nav.profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const { accountType } = useApp();
  const t = useT();
  const homeHref = accountType === "professional" ? "/dashboard" : "/";
  const tabs =
    accountType === "professional"
      ? items
      : items.filter((item) => item.href !== "/jobs");

  return (
    <nav
      className="ona2 shrink-0 border-0 border-t border-ona-border bg-ona-surface px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-between">
        {tabs.map(({ href, labelKey, icon: Icon }) => {
          const to = href === "/" ? homeHref : href;
          const active =
            href === "/"
              ? pathname === "/" || pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <li key={href} className="relative flex-1">
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-4 -top-px h-0.5 rounded-full bg-ona-brand"
                />
              ) : null}
              <Link
                href={to}
                className={cn(
                  "flex min-h-[48px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-ona-brand-ink" : "text-ona-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 1.9} />
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
