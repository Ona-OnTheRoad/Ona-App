"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import {
  MOTORIST_PROFILE_MENU_ITEMS,
  PRO_PROFILE_MENU_ITEMS,
  type ProfileMenuItem,
} from "./profile-menu-items";

export { MOTORIST_PROFILE_MENU_ITEMS, PRO_PROFILE_MENU_ITEMS, type ProfileMenuItem };

interface ProfileMenuCardProps {
  isLight?: boolean;
  items?: ProfileMenuItem[];
}

export function ProfileMenuCard({
  items: customItems,
}: ProfileMenuCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { accountType, hasProAccount, hasMotoristAccount, switchAccount } = useApp();
  const [switching, setSwitching] = useState(false);
  const isPro = accountType === "professional";

  const proGatewayItem: ProfileMenuItem = hasProAccount
    ? {
        id: "switch-pro",
        title: "Switch to Repair Pro",
        subtitle: "Open Pro dashboard & Go Live",
        iconSrc: "/icons/profile-pricing-and-services.png",
        href: "/dashboard",
        onClick: async (e: React.MouseEvent) => {
          e.preventDefault();
          if (switching) return;
          setSwitching(true);
          try {
            await switchAccount("professional");
            router.push("/dashboard");
          } finally {
            setSwitching(false);
          }
        },
      }
    : {
        id: "become-pro",
        title: "Become a Repair Pro",
        subtitle: "Apply with your motorist details",
        iconSrc: "/icons/profile-pricing-and-services.png",
        href: "/signup/pro?from=profile&attach=1&next=/dashboard",
      };

  const customerGatewayItem: ProfileMenuItem = hasMotoristAccount
    ? {
        id: "switch-customer",
        title: "Switch to Customer",
        subtitle: "Book repairs and services",
        iconSrc: "/icons/profile-pricing-and-services.png",
        href: "/",
        onClick: async (e: React.MouseEvent) => {
          e.preventDefault();
          if (switching) return;
          setSwitching(true);
          try {
            await switchAccount("motorist");
            router.push("/");
          } finally {
            setSwitching(false);
          }
        },
      }
    : {
        id: "become-customer",
        title: "Become a Customer",
        subtitle: "Request repairs & roadside services",
        iconSrc: "/icons/profile-pricing-and-services.png",
        href: "/signup/motorist?from=profile&attach=1&next=/",
      };

  const defaultItems = isPro
    ? [...PRO_PROFILE_MENU_ITEMS, customerGatewayItem]
    : [...MOTORIST_PROFILE_MENU_ITEMS, proGatewayItem];

  const items = customItems ?? defaultItems;

  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface shadow-sm overflow-hidden pb-1">
      {items.map((item) => {
        const itemTitle = item.titleKey ? t(item.titleKey) : item.title;
        const itemSubtitle = item.subtitleKey ? t(item.subtitleKey) : item.subtitle;
        const isSwitchingThis =
          (item.id === "switch-pro" || item.id === "switch-customer") && switching;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={item.onClick}
            className="flex items-center gap-3.5 mx-4 py-3.5 transition-colors border-b border-ona-border last:border-b-0 hover:bg-black/2 active:bg-black/4 dark:hover:bg-white/3 dark:active:bg-white/6 group"
          >
            {/* Soft brand container for icon */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ona-brand-soft">
              <Image
                src={item.iconSrc}
                alt={itemTitle}
                width={20}
                height={20}
                unoptimized
                className="h-4 w-4 object-contain"
              />
            </div>

            {/* Title & optional subtitle */}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-tight text-ona-ink">
                {itemTitle}
              </p>
              {itemSubtitle ? (
                <p className="text-[12px] leading-tight mt-0.5 text-ona-muted">
                  {itemSubtitle}
                </p>
              ) : null}
            </div>

            {/* Angle Right or Loader */}
            {isSwitchingThis ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin text-ona-brand-ink" />
            ) : (
              <Image
                alt="Angle right"
                src="/icons/angle-right.png"
                width={12}
                height={12}
                unoptimized
                className="h-4.5 w-4.5 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
