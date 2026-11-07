"use client";

import Link from "next/link";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import {
  LayoutGrid,
  Truck,
  Briefcase,
  Scale,
  CreditCard,
  Package,
  ShieldCheck,
  UserX,
  Coins,
  User,
  Wrench,
  RefreshCw,
  Users,
  MessageSquare,
  Star,
  UserPlus,
  Clock,
  Settings,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup } from "./nav-groups";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Truck,
  Briefcase,
  Scale,
  CreditCard,
  Package,
  ShieldCheck,
  UserX,
  Coins,
  User,
  Wrench,
  RefreshCw,
  Users,
  MessageSquare,
  Star,
  UserPlus,
  Clock,
  Settings,
};

export function AdminNav({
  mobileNavOpen,
  setMobileNavOpen,
  navSearch,
  setNavSearch,
  visibleGroups,
  pathname,
  badgeFor,
  onNavClick,
}: {
  mobileNavOpen: boolean;
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
  brandTitle?: string;
  brandSub?: string;
  displayRole?: string;
  navSearch: string;
  setNavSearch: (v: string) => void;
  visibleGroups: NavGroup[];
  pathname: string;
  badgeFor: (href: string) => number;
  onNavClick: (
    e: MouseEvent<HTMLAnchorElement>,
    href: string,
    needsPassword?: boolean,
  ) => Promise<void>;
  theme?: "light" | "dark";
  applyTheme?: (next: "light" | "dark") => void;
  adminName?: string;
  logout?: () => Promise<void>;
}) {
  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 lg:w-60 xl:w-64 p-3 lg:p-4 flex flex-col shrink-0 transition-transform duration-200",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) setMobileNavOpen(false);
      }}
    >
      <div className="w-full h-full bg-[#f8f9fa] dark:bg-[#131316] border border-gray-200/80 dark:border-[#222228] rounded-[24px] p-4 flex flex-col overflow-hidden shadow-xs">
        {/* Brand Logo */}
        <div className="px-2 pt-1 pb-3">
          <Link href="/admin" className="inline-block select-none">
            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
              Ona<span className="text-ona-brand">.</span>
            </span>
          </Link>
        </div>

        {/* Search Input Well */}
        <div className="relative flex items-center w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1a1920] border border-gray-200/90 dark:border-[#27272a] focus-within:border-ona-brand dark:focus-within:border-ona-brand my-2 transition-colors">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
          <input
            type="search"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search"
            autoComplete="off"
            className="w-full bg-transparent border-0 p-0 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Scrollable Nav Groups */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2 text-xs select-none">
          {visibleGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase px-2 mb-1">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                  const count = badgeFor(item.href);
                  const Icon = item.icon ? ICON_MAP[item.icon] : null;

                  return (
                    <Link
                      key={`${group.label}-${item.href}-${item.label}`}
                      href={item.href}
                      onClick={(e) => void onNavClick(e, item.href, item.password)}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors",
                        active
                          ? "bg-[#fff0ed] text-brand dark:bg-[#222634] dark:text-brand-dark font-semibold"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#1f1e25] dark:hover:text-gray-200",
                      )}
                    >
                      {Icon ? (
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            active
                              ? "text-brand dark:text-brand-dark"
                              : "text-gray-400 dark:text-gray-500",
                          )}
                        />
                      ) : null}
                      <span className="truncate flex-1">{item.label}</span>
                      {count > 0 ? (
                        <span className="bg-[#fee2e2] text-[#ef4444] dark:bg-[#3f1e24] dark:text-[#f87171] text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                          {count > 99 ? "99+" : count}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
