"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { SupportScreenHeader } from "./support-screen-header";

export function SupportToolsHub() {
  const router = useRouter();
  const { accountType } = useApp();

  const handleBack = () => {
    navigateBack(router, "/profile", accountType);
  };

  const menuItems = [
    {
      title: "Help & support",
      subtitle: "FAQ & contact care",
      href: "/settings/support",
    },
    {
      title: "Legal",
      subtitle: "Terms & privacy policy",
      href: "/settings/legal",
    },
    {
      title: "About Ona",
      subtitle: "App version & info",
      href: "/settings/about",
    },
  ];

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SupportScreenHeader title="Support & Tools" onBack={handleBack} />

        <div className="rounded-ona-card border border-ona-border bg-ona-surface shadow-xs divide-y divide-ona-border overflow-hidden">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between p-4 hover:bg-ona-field/60 active:bg-ona-field transition-colors"
            >
              <div className="min-w-0 pr-3">
                <p className="text-[12px] font-medium text-ona-ink">
                  {item.title}
                </p>
                <p className="text-[11px] font-normal text-ona-muted mt-0.5">
                  {item.subtitle}
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 text-ona-muted shrink-0"
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
