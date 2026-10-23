"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  FloatingDock,
  type DockItem,
  type DockLinkProps,
} from "react-floating-dock";
import "react-floating-dock/style.css";
import { useAppConfig } from "@/components/app-config-provider";
import { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { useT, type MessageKey } from "@/lib/i18n";
import { defaultBackHref, resetNavStack } from "@/lib/navigation";
import { applyNavOverrides } from "@/lib/nav-schema";
import { useApp } from "@/lib/store";
import { DockExtra, closeDockSheet } from "./app-dock/dock-extra";
import {
  buildDockItems,
  dockVisibleOn,
  isDockActive,
  isHomeHref,
  type DockNavRow,
} from "./app-dock/dock-nav";
import { ProfileDockIcon } from "./app-dock/profile-dock-icon";
import { usePhoneRect } from "./app-dock/use-phone-rect";
import { CLIENT_NAV, PRO_NAV, type MenuIconName } from "./app-menu/menu-nav";

/** True when the dock is on screen (AppFrame reserves its height). */
export function useDockVisible(): boolean {
  const pathname = usePathname() || "/";
  const { isAuthenticated, switchingRole, category } = useApp();
  // An open trade flow owns the whole screen (its CTA is pinned at the bottom).
  return (
    isAuthenticated &&
    !switchingRole &&
    category === "none" &&
    dockVisibleOn(pathname)
  );
}

/**
 * Bottom navigation: four tabs plus a "More" sheet (replaces the ☰ drawer).
 * Same rows, role split and backend overrides as the drawer had.
 */
export function AppDock() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { config } = useAppConfig();
  const { theme, accountType, proServices, setCategory, setSelectedTechId } =
    useApp();
  const notif = useNotificationsOptional();
  const unread = notif?.unreadCount ?? 0;
  const visible = useDockVisible();
  usePhoneRect();

  const isPro = accountType === "professional";
  const roleHome = defaultBackHref(accountType);
  const myShopHref =
    isPro && proServices.length === 1 ? `/shop/c/${proServices[0]}` : "/shop";

  const { primary, more } = useMemo(() => {
    const base = (isPro ? PRO_NAV : CLIENT_NAV).map((i) =>
      i.href === "/shop" ? { ...i, href: myShopHref } : i,
    );
    const rows: DockNavRow[] = base.some((i) => i.href === myShopHref)
      ? base
      : [
          ...base,
          {
            href: myShopHref,
            labelKey: "nav.myShop" as MessageKey,
            icon: "shop" as MenuIconName,
          },
        ];
    const nav = applyNavOverrides(
      rows,
      isPro
        ? config.content.proMenuOverrides
        : config.content.mainMenuOverrides,
      { role: isPro ? "pro" : "client", myShopHref },
    );
    const built = buildDockItems(nav, t, myShopHref, roleHome, ProfileDockIcon);
    const bell: DockItem = {
      key: "/notifications",
      href: "/notifications",
      label: t("menu.notifications"),
      icon: Bell,
      badge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
    };
    return {
      primary: built.primary,
      more: [bell, ...built.more],
    };
  }, [config.content, isPro, myShopHref, roleHome, t, unread]);

  const DockLink = useMemo(
    () =>
      function DockLink({
        href,
        className,
        children,
        onClick,
        ...rest
      }: DockLinkProps) {
        return (
          <Link
            href={href}
            className={className}
            {...rest}
            onClick={(e) => {
              onClick?.();
              closeDockSheet();
              // Home always opens on a blank trade selector, never a stale flow.
              if (isHomeHref(href, roleHome)) {
                e.preventDefault();
                setCategory("none");
                setSelectedTechId(null);
                resetNavStack(href);
                router.replace(href);
              }
            }}
          >
            {children}
          </Link>
        );
      },
    [roleHome, router, setCategory, setSelectedTechId],
  );

  if (!visible) return null;

  return (
    <FloatingDock
      items={primary}
      moreItems={more}
      isActive={(href) => isDockActive(href, pathname, roleHome, myShopHref)}
      LinkComponent={DockLink}
      theme={theme === "light" ? "light" : "dark"}
      ariaLabel={t("nav.main")}
      moreSheetTitle="Menu"
      closeLabel={t("menu.closeMenu")}
      extraContent={<DockExtra />}
    />
  );
}
