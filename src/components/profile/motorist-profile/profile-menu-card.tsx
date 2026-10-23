"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export interface ProfileMenuItem {
  id: string;
  titleKey?: MessageKey;
  subtitleKey?: MessageKey;
  title: string;
  subtitle?: string;
  iconSrc: string;
  href: string;
  onClick?: (e: React.MouseEvent) => void | Promise<void>;
}

export const MOTORIST_PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: "personal-info",
    titleKey: "settings.hub.personalInfo",
    title: "Personal Info",
    iconSrc: "/icons/profile-personal-info.png",
    href: "/profile/personal-info",
  },
  {
    id: "appearance",
    titleKey: "settings.hub.appearance",
    subtitleKey: "settings.hub.appearanceDetail",
    title: "Appearance",
    subtitle: "Theme & language",
    iconSrc: "/icons/profile-appearance.png",
    href: "/settings/appearance",
  },
  {
    id: "verification",
    titleKey: "settings.hub.verification",
    subtitleKey: "settings.hub.verificationDetail",
    title: "Verification",
    subtitle: "Identity, phone & tier status",
    iconSrc: "/icons/profile-verification.png",
    href: "/verify",
  },
  {
    id: "refer-earn",
    titleKey: "settings.hub.referEarn",
    subtitleKey: "settings.hub.referEarnDetail",
    title: "Refer & Earn",
    subtitle: "Share your code. Earn credits",
    iconSrc: "/icons/profile-refer-and-earn.png",
    href: "/wallet",
  },
  {
    id: "payments",
    titleKey: "settings.hub.paymentsCustomer",
    subtitleKey: "settings.hub.paymentsDetailCustomer",
    title: "Payments & Refunds",
    subtitle: "Overview, bank & activity",
    iconSrc: "/icons/profile-payment-and-refunds.png",
    href: "/settings/payments",
  },
  {
    id: "security",
    titleKey: "settings.hub.security",
    subtitleKey: "settings.hub.securityDetail",
    title: "Security",
    subtitle: "Password, sessions & alerts",
    iconSrc: "/icons/profile-security.png",
    href: "/settings/sections/security",
  },
  {
    id: "notifications",
    titleKey: "settings.hub.notifications",
    subtitleKey: "settings.hub.notificationsDetail",
    title: "Notifications",
    subtitle: "Alerts & sounds",
    iconSrc: "/icons/profile-notifications.png",
    href: "/settings/sections/notifications",
  },
  {
    id: "privacy",
    titleKey: "settings.hub.privacy",
    subtitleKey: "settings.hub.privacyDetail",
    title: "Privacy & Account",
    subtitle: "Visibility, data & permissions",
    iconSrc: "/icons/profile-privacy-and-accounts.png",
    href: "/settings/sections/privacy",
  },
  {
    id: "support",
    titleKey: "settings.hub.support",
    subtitleKey: "settings.hub.supportDetail",
    title: "Support & Tools",
    subtitle: "Help, legal & about",
    iconSrc: "/icons/profile-support-and-tools.png",
    href: "/settings/sections/support",
  },
  {
    id: "addresses",
    titleKey: "settings.hub.addresses",
    subtitleKey: "settings.hub.addressesDetail",
    title: "Addresses & location",
    subtitle: "Home, Work, service area & pin",
    iconSrc: "/icons/profile-addresses-and-location.png",
    href: "/profile/addresses",
  },
];

interface ProfileMenuCardProps {
  isLight?: boolean;
  items?: ProfileMenuItem[];
}

export function ProfileMenuCard({
  items: customItems,
}: ProfileMenuCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { hasProAccount, switchAccount } = useApp();
  const [switching, setSwitching] = useState(false);

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

  const items = customItems ?? [...MOTORIST_PROFILE_MENU_ITEMS, proGatewayItem];

  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface shadow-sm overflow-hidden pb-1">
      {items.map((item) => {
        const itemTitle = item.titleKey ? t(item.titleKey) : item.title;
        const itemSubtitle = item.subtitleKey ? t(item.subtitleKey) : item.subtitle;
        const isSwitchingThis = item.id === "switch-pro" && switching;

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
                className="h-4.5 w-4.5 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
