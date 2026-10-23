"use client";

import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { SecurityScreenHeader } from "../security-screen-header";
import { SecurityHubMenuCard, type SecurityMenuItem } from "./security-hub-menu-card";

export function SecurityHubScreen() {
  const router = useRouter();
  const { accountType } = useApp();

  const handleBack = () => {
    navigateBack(router, "/profile", accountType);
  };

  const menuItems: SecurityMenuItem[] = [
    {
      title: "Password & 2FA",
      subtitle: "Password and two-factor authentication",
      href: "/settings/security",
    },
    {
      title: "Login sessions & devices",
      subtitle: "See connected browsers and sign out others",
      href: "/settings/sessions",
    },
    {
      title: "Security alerts",
      subtitle: "New logins, password changes, device sign-outs",
      href: "/settings/security-alerts",
    },
  ];

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SecurityScreenHeader title="Security" onBack={handleBack} />
        <SecurityHubMenuCard items={menuItems} />
      </div>
    </div>
  );
}
