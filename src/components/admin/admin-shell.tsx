"use client";

import type { ReactNode } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import { SensitivePasswordHost } from "@/components/admin/sensitive-unlock";
import { cn } from "@/lib/utils";
import { AdminNav } from "./admin-shell/admin-nav";
import { useAdminShell } from "./admin-shell/use-admin-shell";

export function AdminShell({
  children,
  adminName,
  roleLabel,
  adminRole: adminRoleProp,
}: {
  children: ReactNode;
  adminName?: string;
  roleLabel?: string;
  adminRole?: string | null;
}) {
  const {
    pathname,
    theme,
    applyTheme,
    navSearch,
    setNavSearch,
    mobileNavOpen,
    setMobileNavOpen,
    role,
    roleUi,
    displayRole,
    visibleGroups,
    logout,
    onNavClick,
    badgeFor,
  } = useAdminShell({ adminRoleProp, roleLabel });

  return (
    <div className="om-admin-shell" data-admin-role={role}>
      <SensitivePasswordHost />
      {/* Phone mode top bar: hamburger opens the full nav drawer (≤900px) */}
      <div className="om-admin-mobile-bar">
        <button
          type="button"
          className="om-admin-mobile-toggle"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-expanded={mobileNavOpen}
          aria-label="Toggle admin menu"
        >
          {mobileNavOpen ? (
            <X className="om-admin-mobile-toggle-ic" />
          ) : (
            <MenuIcon className="om-admin-mobile-toggle-ic" />
          )}
        </button>
        <span className="om-admin-mobile-brand">{roleUi.brandTitle}</span>
      </div>
      <AdminNav
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        brandTitle={roleUi.brandTitle}
        brandSub={roleUi.brandSub}
        displayRole={displayRole}
        navSearch={navSearch}
        setNavSearch={setNavSearch}
        visibleGroups={visibleGroups}
        pathname={pathname}
        badgeFor={badgeFor}
        onNavClick={onNavClick}
        theme={theme}
        applyTheme={applyTheme}
        adminName={adminName}
        logout={logout}
      />
      <div
        className={cn(
          "om-admin-nav-backdrop",
          mobileNavOpen && "om-admin-nav-backdrop--show",
        )}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden
      />
      <main className="om-admin-main">
        <div className="om-admin-main-rolebar">
          <span className="om-admin-role-chip om-admin-role-chip--inline">
            <span className="om-admin-role-dot" aria-hidden />
            {displayRole}
          </span>
          <span className="om-admin-muted" style={{ fontSize: 12 }}>
            Controls the live Ona app
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
