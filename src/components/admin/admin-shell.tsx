"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Image from "next/image";
import {
  Menu as MenuIcon,
  X,
  Moon,
  Sun,
  Bell,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { SensitivePasswordHost } from "@/components/admin/sensitive-unlock";
import { GUIDES } from "@/components/admin/admin-guide-banner";
import { AdminNav } from "./admin-shell/admin-nav";
import { useAdminShell } from "./admin-shell/use-admin-shell";

export function AdminShell({
  children,
  adminName,
  roleLabel,
  adminRole: adminRoleProp,
  title = "Dashboard",
  subtitle = "Real-time platform metrics, active jobs, dispatch monitoring, escrow, and dispute resolution.",
  guideKey: customGuideKey,
}: {
  children: ReactNode;
  adminName?: string;
  roleLabel?: string;
  adminRole?: string | null;
  title?: string;
  subtitle?: string;
  guideKey?: string;
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
    visibleGroups,
    logout,
    onNavClick,
    badgeFor,
  } = useAdminShell({ adminRoleProp, roleLabel });

  const [helpOpen, setHelpOpen] = useState(false);
  const helpContainerRef = useRef<HTMLDivElement>(null);

  // Close help popover on click outside or Escape
  useEffect(() => {
    if (!helpOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        helpContainerRef.current &&
        !helpContainerRef.current.contains(e.target as Node)
      ) {
        setHelpOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [helpOpen]);

  // Determine active guide based on prop or pathname
  const derivedKey =
    customGuideKey ||
    (pathname.includes("dispute")
      ? "disputes"
      : pathname.includes("job")
      ? "jobs"
      : pathname.includes("dispatch")
      ? "dispatch"
      : pathname.includes("payment")
      ? "payments-control"
      : pathname.includes("shop")
      ? "shop"
      : pathname.includes("deletion")
      ? "deletion"
      : pathname.includes("security")
      ? "security"
      : pathname.includes("credit")
      ? "credit-control"
      : pathname.includes("motorist") || pathname.includes("customer")
      ? pathname.split("/").filter(Boolean).length > 2
        ? "customer-detail"
        : "customers"
      : pathname.includes("pro")
      ? "pros"
      : pathname.includes("account")
      ? "accounts"
      : pathname.includes("user")
      ? "users"
      : pathname.includes("message")
      ? "messages"
      : pathname.includes("review")
      ? "reviews"
      : pathname.includes("signup")
      ? "signups"
      : pathname.includes("audit")
      ? "audit"
      : "dashboard");

  const guide = GUIDES[derivedKey] || GUIDES.dashboard;

  return (
    <div
      className="min-h-screen w-full bg-white dark:bg-[#0b0b0e] text-gray-900 dark:text-white flex flex-col lg:flex-row relative selection:bg-ona-brand-btn/20 selection:text-ona-brand"
      data-admin-role={role}
    >
      <SensitivePasswordHost />

      {/* Mobile Top Bar (≤1024px) */}
      <div className="lg:hidden flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#131316] border-b border-gray-200 dark:border-[#222228] sticky top-0 z-30">
        {/* Left: Hamburger menu + Ona Logo together */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-expanded={mobileNavOpen}
            aria-label="Toggle admin menu"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <span className="font-bold text-lg tracking-tight">
            Ona<span className="text-ona-brand">.</span>
          </span>
        </div>

        {/* Right: Theme Toggle + Bell Notification + Logout (Avatar removed on mobile for space) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-gray-700" />
            )}
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-1 p-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer ml-0.5"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Modern Sidebar */}
      <AdminNav
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
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

      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Top Header Row */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100 dark:border-[#222228]/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
              {title}
            </h1>
            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          </div>

          {/* Right Header Controls (Desktop only - mobile controls live in the sticky top bar) */}
          <div className="hidden lg:flex items-center gap-3 sm:gap-4 shrink-0 select-none">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1920] transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-gray-700" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1920] transition-colors cursor-pointer"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>

            {/* User Profile Avatar */}
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              <Image
                src="/brand/default-pro-avatar.jpg"
                alt={adminName || "Admin avatar"}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Children Content */}
        <main className="mt-6 flex-1 min-w-0">{children}</main>

        {/* Floating Help Circle Button & Popover */}
        <div ref={helpContainerRef} className="select-none">
          {helpOpen && guide && (
            <div
              role="dialog"
              aria-modal="false"
              aria-label="Page Guide"
              className="fixed bottom-18 right-6 z-40 w-85 sm:w-95 max-w-[calc(100vw-3rem)] bg-white dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-2xl p-5 shadow-2xl transition-all text-left"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-xs mb-1">
                    What is this page?
                  </h4>
                  <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {guide.what}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-xs mb-1">
                    How does it work?
                  </h4>
                  <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {guide.how}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-xs mb-1">
                    How do I use it?
                  </h4>
                  <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {guide.use}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setHelpOpen((prev) => !prev)}
            className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-white dark:bg-[#18171c] border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer z-40"
            title={helpOpen ? "Close guide" : "Help & Documentation"}
            aria-label={helpOpen ? "Close guide" : "Help & Documentation"}
            aria-expanded={helpOpen}
          >
            {helpOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <HelpCircle className="w-4.5 h-4.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
