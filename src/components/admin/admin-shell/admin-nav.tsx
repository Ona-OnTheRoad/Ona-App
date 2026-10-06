"use client";

import Link from "next/link";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import type { NavGroup } from "./nav-groups";

export function AdminNav({
  mobileNavOpen,
  setMobileNavOpen,
  brandTitle,
  brandSub,
  displayRole,
  navSearch,
  setNavSearch,
  visibleGroups,
  pathname,
  badgeFor,
  onNavClick,
  theme,
  applyTheme,
  adminName,
  logout,
}: {
  mobileNavOpen: boolean;
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
  brandTitle: string;
  brandSub: string;
  displayRole: string;
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
  theme: "light" | "dark";
  applyTheme: (next: "light" | "dark") => void;
  adminName?: string;
  logout: () => Promise<void>;
}) {
  return (
    <aside
      className={cn("om-admin-nav", mobileNavOpen && "om-admin-nav--open")}
      onClick={(e) => {
        // Navigating from the drawer closes it (phone mode)
        if ((e.target as HTMLElement).closest("a")) setMobileNavOpen(false);
      }}
    >
      <div className="om-admin-brand">
        <span className="om-admin-brand-mark" aria-hidden />
        {brandTitle}
      </div>
      <p className="om-admin-nav-tagline">{brandSub}</p>

      <div className="om-admin-role-chip" title={displayRole}>
        <span className="om-admin-role-dot" aria-hidden />
        {displayRole}
      </div>

      <label
        className="om-admin-nav-search"
        style={{
          display: "block",
          margin: "0.5rem 0.65rem 0.75rem",
        }}
      >
        <span className="sr-only">Search admin directories</span>
        <input
          type="search"
          value={navSearch}
          onChange={(e) => setNavSearch(e.target.value)}
          placeholder="Search directories…"
          autoComplete="off"
          style={{
            width: "100%",
            height: 34,
            border: 0,
            borderRadius: 8,
            padding: "0 0.65rem",
            fontSize: 12,
            fontWeight: 600,
            background: "var(--om-admin-chip-bg, rgba(0,0,0,0.06))",
            color: "inherit",
            outline: "none",
          }}
        />
      </label>

      {visibleGroups.map((group) => (
        <div className="om-admin-nav-group" key={group.label}>
          <div
            className={
              group.label === "Care tools" || group.label === "System"
                ? `om-admin-nav-label om-admin-nav-label--${
                    group.label === "Care tools" ? "care" : "system"
                  }`
                : "om-admin-nav-label"
            }
          >
            {group.label}
          </div>
          {group.items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const count = badgeFor(item.href);
            return (
              <Link
                key={`${group.label}-${item.href}-${item.label}`}
                href={item.href}
                className={active ? "active" : undefined}
                onClick={(e) => void onNavClick(e, item.href, item.password)}
              >
                <span className="om-admin-nav-link-row">
                  <span>{item.label}</span>
                  {count > 0 ? (
                    <span
                      className="om-admin-nav-count"
                      title="Open care items"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
      <div className="om-admin-nav-spacer" />
      <div className="om-admin-nav-foot">
        <div className="om-admin-theme-toggle">
          <button
            type="button"
            className={theme === "light" ? "active" : undefined}
            onClick={() => applyTheme("light")}
          >
            Light
          </button>
          <button
            type="button"
            className={theme === "dark" ? "active" : undefined}
            onClick={() => applyTheme("dark")}
          >
            Dark
          </button>
        </div>
        <p
          className="om-admin-muted"
          style={{ margin: 0, padding: "0 0.35rem" }}
        >
          {adminName || "Staff"}
        </p>
        <button type="button" className="om-admin-btn ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
