import type { MessageKey } from "@/lib/i18n";

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

export const PRO_PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: "personal-info",
    title: "Personal Info",
    iconSrc: "/icons/profile-personal-info.png",
    href: "/profile/personal-info",
  },
  {
    id: "appearance",
    title: "Appearance",
    subtitle: "Theme & language",
    iconSrc: "/icons/profile-appearance.png",
    href: "/settings/appearance",
  },
  {
    id: "verification",
    title: "Verification",
    subtitle: "Identity, phone & tier status",
    iconSrc: "/icons/profile-verification.png",
    href: "/verify",
  },
  {
    id: "refer-earn",
    title: "Refer & Earn",
    subtitle: "Share your code, Earn credits",
    iconSrc: "/icons/profile-refer-and-earn.png",
    href: "/wallet",
  },
  {
    id: "availability",
    title: "Availability & Scheduling",
    subtitle: "Hours, location & coverage",
    iconSrc: "/icons/profile-addresses-and-location.png",
    href: "/settings/availability",
  },
  {
    id: "pricing",
    title: "Pricing & Services",
    subtitle: "Labour fees & skills",
    iconSrc: "/icons/profile-pricing-and-services.png",
    href: "/settings/pricing",
  },
  {
    id: "security",
    title: "Security",
    subtitle: "Password, sessions & alerts",
    iconSrc: "/icons/profile-security.png",
    href: "/settings/sections/security",
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "Alerts & sounds",
    iconSrc: "/icons/profile-notifications.png",
    href: "/settings/sections/notifications",
  },
  {
    id: "privacy",
    title: "Privacy & Account",
    subtitle: "Alerts & sounds",
    iconSrc: "/icons/profile-privacy-and-accounts.png",
    href: "/settings/sections/privacy",
  },
  {
    id: "support",
    title: "Support & Tools",
    subtitle: "Help, legal & about",
    iconSrc: "/icons/profile-support-and-tools.png",
    href: "/settings/sections/support",
  },
];
