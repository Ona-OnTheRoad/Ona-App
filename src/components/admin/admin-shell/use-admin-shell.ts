"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  isPasswordGatedPath,
  promptSensitivePassword,
} from "@/components/admin/sensitive-unlock";
import {
  adminRoleTheme,
  canAccessAdminPathUi,
  navGroupsForRoleUi,
  normalizeAdminRoleUi,
  type AdminRoleUi,
} from "@/lib/admin-role-ui";
import { NAV_GROUPS } from "./nav-groups";

const THEME_KEY = "ona-admin-theme";

export function useAdminShell({
  adminRoleProp,
  roleLabel,
}: {
  adminRoleProp?: string | null;
  roleLabel?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [navCounts, setNavCounts] = useState<{
    customers: number;
    pros: number;
  }>({ customers: 0, pros: 0 });
  const [resolvedRole, setResolvedRole] = useState<AdminRoleUi>("super_admin");
  /** Fast search across every admin directory / nav item */
  const [navSearch, setNavSearch] = useState("");
  /** Phone mode: sidebar slides in as an overlay drawer (≤900px) */
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  /**
   * Activity keep-alive: while an admin tab is open AND visible, gently
   * touch the session every 5 minutes so the 4h idle timeout only counts
   * real inactivity (no surprise logouts mid-work). The 8h hard cap and
   * server-side idle enforcement stay fully intact.
   */
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/admin/auth/me", {
        credentials: "include",
        cache: "no-store",
      }).catch(() => undefined);
    };
    ping();
    const t = window.setInterval(ping, 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Close the phone drawer with Escape
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  const role = normalizeAdminRoleUi(adminRoleProp || resolvedRole);
  const roleUi = adminRoleTheme(role);
  const displayRole = roleLabel || roleUi.label;

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    const next = saved === "dark" || saved === "light" ? saved : "light";
    setTheme(next);
    document.querySelector(".om-admin-root")?.setAttribute("data-theme", next);
  }, []);

  // Resolve role from session if parent didn't pass it
  useEffect(() => {
    if (adminRoleProp) {
      setResolvedRole(normalizeAdminRoleUi(adminRoleProp));
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json();
        if (cancelled || !json?.ok) return;
        setResolvedRole(normalizeAdminRoleUi(json.data?.adminRole));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminRoleProp]);

  useEffect(() => {
    const root = document.querySelector(".om-admin-root");
    root?.setAttribute("data-admin-role", role);
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/pending-counts", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          data?: { nav?: { customers?: number; pros?: number } };
        } | null;
        if (cancelled || !json?.ok || !json.data?.nav) return;
        setNavCounts({
          customers: Number(json.data.nav.customers) || 0,
          pros: Number(json.data.nav.pros) || 0,
        });
      } catch {
        /* ignore */
      }
    };
    void load();
    const t = window.setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [pathname]);

  const visibleGroups = useMemo(() => {
    const allowed = new Set(navGroupsForRoleUi(role));
    const q = navSearch.trim().toLowerCase();
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (!canAccessAdminPathUi(role, item.href)) return false;
        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q) ||
          g.label.toLowerCase().includes(q)
        );
      }),
    })).filter((g) => allowed.has(g.label) && g.items.length > 0);
  }, [role, navSearch]);

  function applyTheme(next: "light" | "dark") {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.querySelector(".om-admin-root")?.setAttribute("data-theme", next);
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    await fetch("/api/admin/care/unlock", { method: "DELETE" }).catch(
      () => null,
    );
    router.replace("/admin/login");
    router.refresh();
  }

  async function onNavClick(
    e: MouseEvent<HTMLAnchorElement>,
    href: string,
    needsPassword?: boolean,
  ) {
    // Super Admin never needs temporary password on navigation
    if (role === "super_admin") return;
    if (!needsPassword && !isPasswordGatedPath(href)) return;
    if (pathname === href || pathname.startsWith(`${href}/`)) return;

    e.preventDefault();
    const pageName = href.split("/").pop() || "page";
    const ok = await promptSensitivePassword({
      title: `Password required`,
      detail: `Enter the temporary staff password before opening ${pageName}. Super Admin does not need this.`,
    });
    if (ok) {
      router.push(href);
    }
  }

  function badgeFor(href: string): number {
    if (href === "/admin/motorists") return navCounts.customers;
    if (href === "/admin/pros") return navCounts.pros;
    return 0;
  }

  return {
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
  };
}
