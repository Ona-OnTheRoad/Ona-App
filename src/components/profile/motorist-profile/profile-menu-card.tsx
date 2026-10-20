"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n, type MessageKey } from "@/lib/i18n";

export interface ProfileMenuItem {
  id: string;
  titleKey?: MessageKey;
  subtitleKey?: MessageKey;
  title: string;
  subtitle?: string;
  iconSrc: string;
  href: string;
}

export const MOTORIST_PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: "personal-info",
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
    title: "Refer & Earn",
    subtitle: "Share your code. Earn credits",
    iconSrc: "/icons/profile-refer-and-earn.png",
    href: "/wallet",
  },
  {
    id: "availability",
    titleKey: "settings.hub.availability",
    subtitleKey: "settings.hub.availabilityDetail",
    title: "Availability & Scheduling",
    subtitle: "Hours, location & coverage",
    iconSrc: "/icons/profile-availability-and-scheduling.png",
    href: "/settings/sections/availability",
  },
  {
    id: "pricing",
    titleKey: "settings.hub.pricing",
    subtitleKey: "settings.hub.pricingDetail",
    title: "Pricing & Services",
    subtitle: "Labour fees & skills",
    iconSrc: "/icons/profile-pricing-and-services.png",
    href: "/settings/sections/pricing",
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
    subtitle: "Alerts & sounds",
    iconSrc: "/icons/profile-privacy-and-accpunts.png",
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
  items = MOTORIST_PROFILE_MENU_ITEMS,
}: ProfileMenuCardProps) {
  const { t, locale } = useI18n();

  const getPersonalLabel = () => {
    switch (locale) {
      case "yo":
        return "Àlàyé Ti Ara Ẹni";
      case "ha":
        return "Bayanin Kai";
      case "ig":
        return "Ozi Onwe Onye";
      case "pcm":
        return "Personal Info";
      case "fr":
        return "Infos personnelles";
      case "es":
        return "Información personal";
      case "pt":
        return "Informações pessoais";
      case "ar":
        return "المعلومات الشخصية";
      case "sw":
        return "Taarifa binafsi";
      case "zh":
        return "个人信息";
      default:
        return "Personal Info";
    }
  };

  const getReferLabel = () => {
    switch (locale) {
      case "yo":
        return "Tọ́ka & Gba Èrè";
      case "ha":
        return "Nuna & Samu";
      case "ig":
        return "Kpọọ & Nata";
      case "pcm":
        return "Refer & Earn";
      case "fr":
        return "Parrainer et gagner";
      case "es":
        return "Recomienda y gana";
      case "pt":
        return "Indique e Ganhe";
      case "ar":
        return "شارك واكسب";
      case "sw":
        return "Alika na Upate";
      case "zh":
        return "推荐并赚取";
      default:
        return "Refer & Earn";
    }
  };

  const getReferSubtitle = () => {
    switch (locale) {
      case "yo":
        return "Pin koodu rẹ. Gba awọn kirediti";
      case "ha":
        return "Raba lambar ku. Samu lada";
      case "ig":
        return "Kekọrịta koodu gị. Nata kredit";
      case "pcm":
        return "Share your code. Earn credits";
      case "fr":
        return "Partagez votre code. Gagnez des crédits";
      case "es":
        return "Comparte tu código. Gana créditos";
      case "pt":
        return "Partilhe o seu código. Ganhe créditos";
      case "ar":
        return "شارك رمزك واكسب رصيداً";
      case "sw":
        return "Shiriki msimbo wako. Pata pointi";
      case "zh":
        return "分享邀请码赚取积分";
      default:
        return "Share your code. Earn credits";
    }
  };

  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface shadow-sm overflow-hidden pb-5">
      {items.map((item) => {
        const itemTitle =
          item.id === "personal-info"
            ? getPersonalLabel()
            : item.id === "refer-earn"
              ? getReferLabel()
              : item.titleKey
                ? t(item.titleKey)
                : item.title;

        const itemSubtitle =
          item.id === "refer-earn"
            ? getReferSubtitle()
            : item.subtitleKey
              ? t(item.subtitleKey)
              : item.subtitle;

        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3.5 mx-4 py-3.5 transition-colors border-b border-ona-border hover:bg-black/2 active:bg-black/4 dark:hover:bg-white/3 dark:active:bg-white/6 group"
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

            {/* Angle Right */}
            <Image
              alt="Angle right"
              src="/icons/angle-right.png"
              width={12}
              height={12}
              className="h-4.5 w-4.5 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        );
      })}
    </div>
  );
}
