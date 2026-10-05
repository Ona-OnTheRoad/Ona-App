import { usePathname, useRouter } from "next/navigation";
import { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { useT } from "@/lib/i18n";
import { MESSAGE_ORANGE } from "@/lib/map-trade-icons";
import { defaultBackHref, resetNavStack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import type { MessageKey } from "@/lib/i18n";
import { MenuItemRow } from "./menu-item-row";
import type { MenuIconName } from "./menu-nav";

export type MenuNavItem = {
  href: string;
  labelKey: MessageKey;
  icon: MenuIconName;
  labelOverride?: string;
};

export function MenuNavItems({
  nav,
  myShopHref,
  isLight,
  onClose,
}: {
  nav: MenuNavItem[];
  myShopHref: string;
  isLight: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const { accountType, setCategory, setSelectedTechId } = useApp();
  const notif = useNotificationsOptional();
  const unread = notif?.unreadCount ?? 0;

  return (
    <>
      {nav.map(({ href, labelKey, icon, labelOverride }) => {
        // Fallback label if i18n key missing (must never blank the My Shop row)
        const label =
          labelOverride ??
          (labelKey === "nav.myShop" ? t(labelKey) || "My Shop" : t(labelKey));
        const roleHome = defaultBackHref(accountType);
        const isHomeItem =
          href === "/" || href === "/dashboard" || href === roleHome;
        const isPaymentsItem = href === "/settings/payments";
        const isSettingsRoot = href === "/settings";
        const isShopItem = href === myShopHref || href === "/shop";
        const active = isHomeItem
          ? pathname === "/" ||
            pathname === "/dashboard" ||
            pathname === roleHome
          : isPaymentsItem
            ? pathname === "/settings/payments" ||
              pathname.startsWith("/settings/payments/")
            : isSettingsRoot
              ? pathname === "/settings" ||
                (pathname.startsWith("/settings/") &&
                  !pathname.startsWith("/settings/payments"))
              : isShopItem
                ? pathname === "/shop" || pathname.startsWith("/shop/")
                : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <MenuItemRow
            key={href + labelKey}
            isLight={isLight}
            active={active}
            icon={icon}
            labelClassName="leading-none"
            dataMenuItem={isShopItem ? "my-shop" : undefined}
            onClick={() => {
              onClose();
              if (isHomeItem) {
                // Dashboard must always open on a blank selector never
                // re-open a previously selected trade/flow.
                setCategory("none");
                setSelectedTechId(null);
                resetNavStack(href);
                router.replace(href);
                return;
              }
              router.push(href);
            }}
          >
            {label === "nav.myShop" ? "My Shop" : label}
          </MenuItemRow>
        );
      })}

      <MenuItemRow
        isLight={isLight}
        icon="notifications"
        labelClassName="min-w-0 flex-1 leading-none"
        onClick={() => {
          onClose();
          notif?.openCenter();
        }}
        trailing={
          unread > 0 ? (
            <span
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{
                backgroundColor: MESSAGE_ORANGE,
              }}
              aria-label={`${unread} unread`}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null
        }
      >
        {t("menu.notifications")}
      </MenuItemRow>
    </>
  );
}
