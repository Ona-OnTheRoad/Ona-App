"use client";

import { useAppConfig } from "@/components/app-config-provider";
import { useT } from "@/lib/i18n";
import { applyNavOverrides } from "@/lib/nav-schema";
import type { MessageKey } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MenuFooter } from "./app-menu/menu-footer";
import { MenuHeader } from "./app-menu/menu-header";
import {
  CLIENT_NAV,
  firstAndLastName,
  PRO_NAV,
  type MenuIconName,
} from "./app-menu/menu-nav";
import { MenuNavItems } from "./app-menu/menu-nav-items";
import { MyServiceSection } from "./app-menu/my-service-section";
import { UseAsSection } from "./app-menu/use-as-section";
import { useAccountSwitch } from "./app-menu/use-account-switch";
import { useMenuTransition } from "./app-menu/use-menu-transition";

export function AppMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const { config: appCfg } = useAppConfig();
  const cfgContent = appCfg.content;
  const {
    theme,
    accountType,
    proServices,
    hasMotoristAccount,
    hasProAccount,
    displayName,
    userProfile,
  } = useApp();
  const isLight = theme === "light";
  /**
   * Menu role must follow active accountType only.
   * userMode can lag/mismatch dual-role and wrongly show Pro nav (or hide
   * customer-only placement). My Shop lives on both CLIENT_NAV and PRO_NAV.
   */
  const isPro = accountType === "professional";
  /**
   * Pro My Shop deep-link: single-trade Pros land directly inside their own
   * trade shop (e.g. /shop/c/solar). Multi-trade / customers stay general.
   */
  const myShopHref =
    isPro && proServices.length === 1 ? `/shop/c/${proServices[0]}` : "/shop";
  const navBase = (isPro ? PRO_NAV : CLIENT_NAV).map((i) =>
    i.href === "/shop" ? { ...i, href: myShopHref } : i,
  );
  /** Hard-guarantee My Shop is present for both roles (never drop the row). */
  const navWithShop = navBase.some((i) => i.href === myShopHref)
    ? navBase
    : [
        ...navBase,
        {
          href: myShopHref,
          labelKey: "nav.myShop" as MessageKey,
          icon: "shop" as MenuIconName,
        },
      ];
  /**
   * Whitelist overrides: backend may hide / reorder / relabel KNOWN rows only
   * (see nav-schema.ts). Unknown ids ignored; protected rows always render;
   * empty or broken config → compiled nav untouched. Menus can never vanish.
   */
  const nav = applyNavOverrides(
    navWithShop,
    isPro ? cfgContent.proMenuOverrides : cfgContent.mainMenuOverrides,
    { role: isPro ? "pro" : "client", myShopHref },
  );
  /** Active account first (left Use-as button when dual) */
  const useAsOrder: AccountType[] =
    hasMotoristAccount && hasProAccount
      ? accountType === "professional"
        ? ["professional", "motorist"]
        : ["motorist", "professional"]
      : ["motorist", "professional"];

  const fullNameDisplay = firstAndLastName(
    userProfile?.fullName || displayName || "",
  );

  const timeGreeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("menu.goodMorning");
    if (h < 17) return t("menu.goodAfternoon");
    return t("menu.goodEvening");
  })();

  const { warn, signupTarget, switching, onSwitch } = useAccountSwitch(
    open,
    onClose,
  );
  const { mounted, exiting } = useMenuTransition(open);

  if (!mounted) return null;

  /*
   * Shared open geometry (light ≡ dark) no layer lapping:
   * left 80% = solid theme drawer + dim under it only
   * right 20% = capsule rail (pill + close hit)
   * ONE chrome transform moves drawer + capsule together (not separate anims).
   */
  return (
    <div
      className="om-x-menu absolute inset-0 z-[100] max-h-full max-w-full overflow-hidden bg-transparent"
      role="dialog"
      aria-modal
    >
      {/*
 Single sliding unit: dim + drawer + capsule rail share one transform.
 Capsule is a window over the page separate rail fade left it “paused”.
 */}
      <div
        className={cn(
          "om-x-chrome absolute inset-0",
          exiting ? "om-x-chrome-out" : "om-x-chrome-in",
        )}
      >
        {/* Dim only under the solid menu (never under the capsule rail) */}
        {/* Dim only under the solid menu (never under the capsule rail) */}
        <button
          type="button"
          className={cn(
            "om-x-dim absolute bottom-0 left-0 top-0 z-[1] border-0",
            isLight ? "bg-transparent" : "bg-black/30",
          )}
          aria-label={t("menu.closeMenu")}
          onClick={onClose}
        />
        {/* Solid theme sidebar left extension only (not curved out) */}
        <aside
          className={cn(
            "om-x-drawer absolute bottom-0 left-0 top-0 z-10 flex flex-col",
            isLight ? "bg-[#c8c9cd]" : "bg-black",
          )}
        >
          <MenuHeader
            isLight={isLight}
            fullNameDisplay={fullNameDisplay}
            timeGreeting={timeGreeting}
          />

          <nav className="min-h-0 flex-1 space-y-0 overflow-y-auto overflow-x-hidden px-2 pb-1 pt-2.5 scrollbar-hide">
            <MenuNavItems
              nav={nav}
              myShopHref={myShopHref}
              isLight={isLight}
              onClose={onClose}
            />

            <div className="mt-1 px-1">
              {isPro && proServices.length > 0 && (
                <MyServiceSection isLight={isLight} proServices={proServices} />
              )}
              <UseAsSection
                isLight={isLight}
                accountType={accountType}
                hasMotoristAccount={hasMotoristAccount}
                hasProAccount={hasProAccount}
                useAsOrder={useAsOrder}
                switching={switching}
                warn={warn}
                signupTarget={signupTarget}
                onSwitch={onSwitch}
                onClose={onClose}
              />
            </div>
          </nav>

          <MenuFooter isLight={isLight} onClose={onClose} />
        </aside>

        {/*
 Right capsule rail exclusive strip (starts at 80%, no drawer overlap).
 Rides inside om-x-chrome so it slides with the drawer.
 */}
        <div className="om-x-rail pointer-events-none absolute z-20">
          <div
            className="om-x-capsule pointer-events-none absolute"
            aria-hidden
          />
          <button
            type="button"
            className="om-x-capsule-hit absolute z-[1] border-0 bg-transparent pointer-events-auto"
            aria-label={t("menu.closeMenu")}
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}
